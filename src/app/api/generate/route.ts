import { NextResponse } from "next/server";
import { generateText } from "ai";

// Import Typhoon client utility
import { typhoon } from "@/lib/typhoon";
import { TYPHOON_MODEL } from "@/const";


const cleanedCodeBlock = (text: string) => {
    // This will match any opening code fence with optional language specification
  // For example: ```javascript, ```python, ```mdx, etc.
  text = text.replace(/^```(?:[a-zA-Z0-9]+)?/gm, '');
  
  // Remove closing code fences
  text = text.replace(/```$/gm, '');
  // Trim extra whitespace
  return text.trim();
}
// System prompt to transform the AI into a world-class storyteller and pitch expert
const SYSTEM_PROMPT = `You are Typhoon the PITCH MASTER, the world's best storyteller and startup pitch creator.

Your expertise:
- Crafting narratives that capture hearts and minds in seconds
- Turning complex ideas into simple, relatable stories
- Creating high-impact, investor-ready pitch decks
- Identifying and highlighting unique value propositions
- Transforming dry facts into emotional journeys

Your approach to any pitch:
1. Find the emotional core of the idea that will resonate universally
2. Structure the narrative with a compelling hook, clear problem statement, and inspiring vision
3. Use concrete examples and metaphors that make abstract concepts tangible
4. Balance aspirational vision with practical credibility
5. End with a powerful call to action that creates urgency

Your slides always:
- Tell a cohesive story, not just present information
- Use vivid, concrete language that creates mental images
- Include surprising elements that grab and maintain attention
- Follow the "less is more" principle - each slide makes ONE powerful point
- Mix logical arguments with emotional appeals
- Use narrative techniques from the world's best TED talks and pitch competitions

Make every slide as if billions in funding depend on it, because they might.`;

// Define interfaces for slide plan types
interface SlideContent {
  slideNumber: number;
  slideType: string;
  slideTitle: string;
  keyMessage: string;
  content: string[];
  storytellingElement: string;
  notes: string;
}

interface SlidePlan {
  title: string;
  totalSlides: number;
  slides: SlideContent[];
  overallNarrative: string;
}

// Status tracking interface for generation process
interface GenerationStatus {
  id: string;
  status: 'understanding' | 'planning' | 'generating' | 'finalizing' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  result?: string;
  error?: string;
  phaseContent?: {
    understanding?: string;
    planning?: string;
    generating?: string[];
    finalizing?: string;
  };
}

// In-memory store for tracking generation status
// In a production app, this would be a database or Redis
const statusStore = new Map<string, GenerationStatus>();

// Helper function to generate a unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Step 1: Planning - determine content structure based on user persona and slide goal
const createPlanningPrompt = (userPrompt: string, userPersona: string, slideGoal: string, slideConstraint: string, task: string, slideContext?: string) => {
  // For chat tasks, create a simple response prompt
  if (task === "chat") {
    return `
### Chat Interaction Request
I need you to respond to a user's question or message as PITCH MASTER.

### User message:
"${userPrompt}"

### Instructions:
Respond to the user in your role as PITCH MASTER, providing expert advice or information about:
- Effective presentation and pitching techniques
- Slide design best practices
- Storytelling for business contexts
- Any other relevant topics related to presentations and pitches

Format your response clearly and concisely. Focus on being helpful and sharing your expertise.
`;
  }
  
  // For edit tasks, use a focused prompt for editing existing slides
  if (task === "edit") {
    return `
### Slide Editing Request
I need you to plan how to edit an existing slide based on the following:

### Task:
${task}

### User prompt:
"${userPrompt}"

### User persona:
${userPersona || "Business professional looking to modify existing slide content"}

### Slide goal:
${slideGoal || "Improve an existing slide to be more effective and engaging"}

### Slide constraint:
${slideConstraint}

### Existing slide content (to be edited):
${slideContext || "No existing content provided"}

### Instructions:
Plan how to edit the existing slide by:
1. Identifying what elements to keep, modify, or remove
2. Determining how to incorporate new content from the user prompt
3. Ensuring the slide maintains a coherent message
4. Respecting the existing style while making improvements

Your response should be a structured JSON object with the following format:
{
  "title": "Presentation Title",
  "task": "edit",
  "totalSlides": 1,
  "slides": [
    {
      "slideNumber": 1,
      "slideType": "specific_slide_type",
      "slideTitle": "Updated Slide Title",
      "keyMessage": "Updated main point of this slide",
      "content": ["updated bullet point 1", "updated bullet point 2", "..."],
      "storytellingElement": "Updated narrative element for this slide",
      "notes": "Additional guidelines for editing this slide"
    }
  ],
  "overallNarrative": "Brief description of how this edited slide fits into a broader narrative"
}

Think deeply about how to improve the slide while maintaining its core purpose.
`;
  }
  
  // For create tasks, use the original comprehensive planning prompt
  return `
### Slide Planning Request
Create a detailed plan for a slide presentation based on the following:

### Task:
${task}

### User prompt:
"${userPrompt}"

### User persona:
${userPersona || "Business professional looking to pitch an idea or concept"}

### Slide goal:
${slideGoal || "Persuade an audience effectively and create engagement"}

### Slide constraint:
${slideConstraint}

### Instructions:
Create a slide-by-slide plan that outlines:
1. The overall narrative structure and flow
2. The key message of each slide
3. What content (points, stories, data) should be included on each slide
4. How many slides are needed in total
5. Appropriate storytelling elements for this audience
6. Critical persuasive elements to include

Your response should be a structured JSON object with the following format:
{
  "title": "Presentation Title",
  "task": "create",
  "totalSlides": number,
  "slides": [
    {
      "slideNumber": number,
      "slideType": "cover|introduction|problem|solution|data|quote|story|conclusion|etc",
      "slideTitle": "Slide Title",
      "keyMessage": "Main point of this slide",
      "content": ["bullet point 1", "bullet point 2", "..."],
      "storytellingElement": "Key narrative element for this slide",
      "notes": "Additional guidelines for creating this slide"
    }
  ],
  "overallNarrative": "Description of how the slides flow together as a cohesive story"
}

Think deeply about the most effective structure to achieve the slide goal for the intended audience.
`;
};

// Step 2: Execution - Create information extraction prompt
const createInfoExtractionPrompt = (slidePlan: SlidePlan, slideNumber: number, userPrompt: string) => {
  const slide = slidePlan.slides[slideNumber - 1];
  return `
### Information Extraction for Slide
I need you to extract relevant information for creating a slide based on the following:

### Original user prompt:
"${userPrompt}"

### Overall presentation:
Title: "${slidePlan.title}"
Total slides: ${slidePlan.totalSlides}
Overall narrative: "${slidePlan.overallNarrative}"

### This specific slide (${slideNumber} of ${slidePlan.totalSlides}):
Slide type: ${slide.slideType}
Slide title: "${slide.slideTitle}"
Key message: "${slide.keyMessage}"
Content points: ${JSON.stringify(slide.content)}
Storytelling element: "${slide.storytellingElement}"

### Instructions:
Extract and organize the most relevant information for this slide by:
1. Identifying key facts, statistics, or examples from the user prompt that support this slide's key message
2. Finding compelling ways to express the main idea that will resonate with the audience
3. Suggesting metaphors, analogies, or stories that could enhance the storytelling element
4. Organizing the information in a logical flow that builds toward the key message

Return a JSON object with the following format:
{
  "keyFacts": ["fact 1", "fact 2", ...],
  "compellingExpressions": ["expression 1", "expression 2", ...],
  "storytellingElements": ["element 1", "element 2", ...],
  "recommendedStructure": "Brief description of how to structure this information"
}
`;
};

// Step 2.5: Content Creation - create the actual slide content based on extracted information
const createSlideContentPrompt = (slidePlan: SlidePlan, slideNumber: number, extractedInfo: ExtractedSlideInfo, slideConstraint: string) => {
  const slide = slidePlan.slides[slideNumber - 1];
  return `
### Slide Content Creation
I need you to rewrite a extracted information into ONE detailed slide based on the following:
The slide should follow the slide constraint: "${slideConstraint}" 

### Slide information:
Slide type: ${slide.slideType}
Slide title: "${slide.slideTitle}"
Key message: "${slide.keyMessage}"
Content points: ${JSON.stringify(slide.content)}

### General constraints:
- No images, no tables
- If a specific language is requested, the content should use natural expressions in that language, not direct translations


### Slide constraint:
${slideConstraint}

### Extracted information:
Key facts: ${JSON.stringify(extractedInfo.keyFacts)}
Compelling expressions: ${JSON.stringify(extractedInfo.compellingExpressions)}
Storytelling elements: ${JSON.stringify(extractedInfo.storytellingElements)}
Recommended structure: "${extractedInfo.recommendedStructure}"

### Instructions:
Create detailed MDX content for just this ONE slide following these guidelines:
1. Use MDX markdown format
2. Use heading levels (#, ##, ###) appropriately
3. Include bullet points with "-" where appropriate
4. Use basic markdown formatting (bold, italic, lists) to enhance readability
5. Keep the slide focused on the single idea from the plan
6. Make the content visually balanced and easy to scan
7. IMPORTANT: Limit to a maximum of 9 lines of content (including headings and bullet points)
8. Add vivid, impactful language that creates mental images
9. Incorporate the storytelling elements appropriately
10. The slide should follow the slide constraint: "${slideConstraint}" strictly
11. VERY IMPORTANT: If the constraint involves a non-English language, use natural, native expressions in that language. Avoid direct translations that sound unnatural. Think like a native speaker of that language rather than translating from English.
Return ONLY the MDX content for this single slide, without any additional explanation.
`;
};

// Define interface for extracted information
interface ExtractedSlideInfo {
  keyFacts: string[];
  compellingExpressions: string[];
  storytellingElements: string[];
  recommendedStructure: string;
}

// Step 3: Refinement - merge all slides into a cohesive presentation
const createRefinementPrompt = (slides: string[], slidePlan: SlidePlan, slideConstraint: string) => {
  console.log('final slide before refinement', slides)
  return `
### Slide Presentation Refinement
I have a set of individual slides that need to be refined into a cohesive presentation.

### Original presentation plan:
Title: "${slidePlan.title}"
Total slides: ${slidePlan.totalSlides}
Overall narrative: "${slidePlan.overallNarrative}"

### Individual slides content:
${slides.map((slide) => `---\n${slide}\n`).join('\n')}

### Instructions:
Refine these slides into a cohesive presentation by:
1. Ensuring narrative flow between slides
2. Maintaining consistent formatting and style
3. Adding transition phrases or elements where needed
4. Ensuring the story builds properly from beginning to end
5. Verifying that the key message of each slide connects to the overall goal
6. Removing any redundancy between slides
7. Make sure each slide is still limited to maximum 9 lines of content
8. Make sure the slide is still following the slide constraint: "${slideConstraint}" strictly
9. If the constraint involves a non-English language, ensure all language sounds natural to native speakers, not like a direct translation
10. Use idiomatic expressions and phrasings that feel native to the target language
11. Return the final presentation with each slide separated by "---" (three dashes on a single line)
12. Here is the final presentation format:
---
# Slide 1 Title
Slide1 content
---
# Slide 2 Title
Slide2 content
`;
};

// Function to generate a single slide
async function generateSlide(slidePlan: SlidePlan, slideNumber: number, userPrompt: string, slideConstraint: string): Promise<string> {
  // Phase 1: Extract relevant information
  console.log(`Phase 1 for Slide ${slideNumber}: Extracting relevant information...`);
  const extractionPrompt = createInfoExtractionPrompt(slidePlan, slideNumber, userPrompt);
  
  const extractionResult = await generateText({
    model: typhoon(TYPHOON_MODEL),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: extractionPrompt },
    ],
    temperature: 0.5,
    maxTokens: 4096,
  });
  
  let extractedInfo: ExtractedSlideInfo;
  try {
    extractedInfo = JSON.parse(cleanedCodeBlock(extractionResult.text)) as ExtractedSlideInfo;
    console.log(`Extracted information for Slide ${slideNumber}:`, extractedInfo);
  } catch (parseError) {
    console.error(`Error parsing extracted information for Slide ${slideNumber}:`, parseError);
    // Provide default structure if parsing fails
    extractedInfo = {
      keyFacts: slidePlan.slides[slideNumber - 1].content,
      compellingExpressions: [slidePlan.slides[slideNumber - 1].keyMessage],
      storytellingElements: [slidePlan.slides[slideNumber - 1].storytellingElement],
      recommendedStructure: "Follow the content points in order"
    };
  }
  
  // Phase 2: Generate the slide content
  console.log(`Phase 2 for Slide ${slideNumber}: Creating slide content...`);
  const contentPrompt = createSlideContentPrompt(slidePlan, slideNumber, extractedInfo, slideConstraint);
  
  const contentResult = await generateText({
    model: typhoon(TYPHOON_MODEL),
    maxTokens: 8192,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: contentPrompt },
    ],
    temperature: 0.7,
  });
  
  return cleanedCodeBlock(contentResult.text);
}

// Extract parameters from prompt using AI
async function extractParametersFromPrompt(
  generationId: string,
  userPrompt: string, 
  slideContext?: string
): Promise<{
  userPersona: string;
  slideGoal: string;
  slideConstraint: string;
  task: string;
}> {
  // Get current status or create a new one with empty phaseContent
  const initialStatus = statusStore.get(generationId) || {
    id: generationId,
    status: 'understanding',
    progress: 0,
    message: 'Processing your request...',
    phaseContent: {}
  };
  
  // Update status
  statusStore.set(generationId, {
    ...initialStatus,
    status: 'understanding',
    progress: 5,
    message: 'Analyzing your request...'
  });

  const extractionPrompt = `
### Parameter Extraction Task
I need you to analyze a user's prompt for slide creation and identify the following key parameters:

${slideContext ? `### Slide Context:\n${slideContext}` : ''}

### General constraints:
- No images, no tables
- If a specific language is requested, the content should use natural expressions in that language, not direct translations

### Instructions:
From the user prompt, extract the following parameters:

1. User Persona: Who is the intended audience or presenter for these slides? (e.g., business executive, teacher, student, marketer)
2. Slide Goal: What is the main purpose of these slides? (e.g., persuade, inform, educate, entertain)
3. Slide Constraint: Are there any specific formatting, style, or content constraints? (e.g., "use dark colors", "include data visualization", "5 slides max")
4. Task Type: Is this a "create" task for new slides, an "edit" task for existing slides, or a "chat" task for just answering questions or general conversation?

Your response should be a structured JSON object with the following format:
{
  "task": "create, edit, or chat",
  "userPersona": "extracted persona or 'General business professional' if not specified",
  "slideGoal": "extracted goal or 'Inform and persuade' if not specified",
  "slideConstraint": "extracted user constraints combined with general constraints",
}

Bias to chat tasks if the user's prompt is a question or a conversation.
For "chat" tasks, the user is not asking to create or edit slides, but rather just asking questions or having a conversation.
If certain parameters aren't explicitly stated, use reasonable defaults based on context.

### User Prompt:
"${userPrompt}"
`;

  const extractionResult = await generateText({
    model: typhoon(TYPHOON_MODEL),
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: extractionPrompt },
    ],
    maxTokens: 4096,
    temperature: 0.2,
  });
  
  // Store the understanding phase content
  const currentStatus = statusStore.get(generationId);
  if (currentStatus) {
    const updatedPhaseContent = {
      ...(currentStatus.phaseContent),
      understanding: extractionResult.text
    };
    
    console.log("Updating understanding phase content, keys:", Object.keys(updatedPhaseContent));
    
    statusStore.set(generationId, {
      ...currentStatus,
      phaseContent: updatedPhaseContent
    });
  }
  
  try {
    const extractedParams = JSON.parse(cleanedCodeBlock(extractionResult.text));
    
    // Ensure the returned object has all the expected keys
    return {
      userPersona: extractedParams.userPersona || "General business professional",
      slideGoal: extractedParams.slideGoal || "Inform and persuade",
      slideConstraint: extractedParams.slideConstraint || "No specific constraints",
      task: extractedParams.task || "create",
    };
  } catch (error) {
    console.error("Error parsing parameter extraction JSON:", error);
    throw new Error("Failed to extract parameters from prompt");
  }
}

// Function to run the complete three-step process
async function runFullSlideGeneration(
  generationId: string,
  userPrompt: string, 
  userPersona: string = "", 
  slideGoal: string = "",
  slideConstraint: string = "",
  task: string = "",
  slideContext: string = ""
): Promise<string> {
  // Get current status or create a new one with empty phaseContent
  const initialStatus = statusStore.get(generationId) || {
    id: generationId,
    status: 'understanding',
    progress: 0,
    message: 'Processing your request...',
    phaseContent: {}
  };
  
  // Update status to planning
  statusStore.set(generationId, {
    ...initialStatus,
    status: 'planning',
    progress: 15,
    message: 'Planning presentation structure...'
  });

  console.log("Step 1: Planning presentation structure...");
  // Step 1: Create the plan
  const planningPrompt = createPlanningPrompt(userPrompt, userPersona, slideGoal, slideConstraint, task, slideContext);
  const planResult = await generateText({
    model: typhoon(TYPHOON_MODEL),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: planningPrompt },
    ],
    maxTokens: 8192,
    temperature: 0.7,
  });
  
  // Store the planning phase content
  const currentStatusAfterPlanning = statusStore.get(generationId);
  if (currentStatusAfterPlanning) {
    const updatedPhaseContent = {
      ...(currentStatusAfterPlanning.phaseContent),
      planning: planResult.text
    };
    
    console.log("Updating planning phase content, keys:", Object.keys(updatedPhaseContent));
    
    statusStore.set(generationId, {
      ...currentStatusAfterPlanning,
      phaseContent: updatedPhaseContent
    });
  }
  
  // Parse the slide plan
  let slidePlan: SlidePlan;
  try {
    slidePlan = JSON.parse(cleanedCodeBlock(planResult.text)) as SlidePlan;
    console.log(`Created plan with ${slidePlan.totalSlides} slides for "${slidePlan.title}"`);
  } catch (parseError) {
    console.error("Error parsing slide plan JSON:", parseError);
    // Update status to error
    statusStore.set(generationId, {
      id: generationId,
      status: 'error',
      progress: 0,
      message: 'Failed to parse slide plan',
      error: 'Failed to parse slide plan result'
    });
    throw new Error("Failed to parse slide plan result");
  }
  
  // Update status to generating

  const currentStatusBeforeGenerating = statusStore.get(generationId);
  statusStore.set(generationId, {
    ...currentStatusBeforeGenerating!,
    id: generationId,
    status: 'generating',
    progress: 30,
    message: 'Generating individual slides...'
  });
  
  // Step 2: Generate each individual slide (now in two phases)
  console.log("Step 2: Generating individual slides (two-phase process)...");
  const slidePromises: Promise<string>[] = [];
  console.log('slidePlan', slidePlan)
  
  for (let i = 1; i <= slidePlan.totalSlides; i++) {
    slidePromises.push(generateSlide(slidePlan, i, userPrompt, slideConstraint));
  }
  
  const slides = await Promise.all(slidePromises);
  console.log(`Generated ${slides.length} individual slides`);
  
  // Store the generated slides content
  const currentStatusAfterGenerating = statusStore.get(generationId);
  if (currentStatusAfterGenerating) {
    const updatedPhaseContent = {
      ...(currentStatusAfterGenerating.phaseContent),
      generating: slides
    };
    
    console.log("Updating generating phase content, keys:", Object.keys(updatedPhaseContent));
    
    statusStore.set(generationId, {
      ...currentStatusAfterGenerating,
      phaseContent: updatedPhaseContent
    });
  }
  
  // Update status to finalizing
  const currentStatusBeforeFinalizing = statusStore.get(generationId);
  statusStore.set(generationId, {
    ...currentStatusBeforeFinalizing!,
    id: generationId,
    status: 'finalizing',
    progress: 80,
    message: 'Refining the complete presentation...'
  });
  
  // Step 3: Refine the presentation
  console.log("Step 3: Refining the complete presentation...");
  const refinementPrompt = createRefinementPrompt(slides, slidePlan, slideConstraint);
  const refinementResult = await generateText({
    model: typhoon(TYPHOON_MODEL),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: refinementPrompt },
    ],
    temperature: 0.7,
    maxTokens: 16384,
  });
  
  // Store the finalizing phase content
  const currentStatusAfterFinalizing = statusStore.get(generationId);
  if (currentStatusAfterFinalizing) {
    const updatedPhaseContent = {
      ...(currentStatusAfterFinalizing.phaseContent),
      finalizing: refinementResult.text
    };
    
    console.log("Updating finalizing phase content, keys:", Object.keys(updatedPhaseContent));
    
    statusStore.set(generationId, {
      ...currentStatusAfterFinalizing,
      phaseContent: updatedPhaseContent
    });
  }
  
  const result = cleanedCodeBlock(refinementResult.text);
  
  // Update status to completed
  const finalStatus = statusStore.get(generationId);
  statusStore.set(generationId, {
    id: generationId,
    status: 'completed',
    progress: 100,
    message: 'Slide generation complete',
    result,
    phaseContent: finalStatus?.phaseContent
  });
  
  console.log("Slide generation complete");
  return result;
}

// For direct editing of a slide without the full planning process
const createDirectEditPrompt = (userPrompt: string, slideConstraint: string, slideContext: string) => {
  return `
### Direct Slide Editing Task
I need you to edit an existing slide based on the user's instructions.

### User's edit request:
"${userPrompt}"

### Existing slide content:
${slideContext}

### Slide constraint:
${slideConstraint}

### Instructions:
1. Carefully read both the existing slide content and the user's edit request
2. Modify the slide according to the user's instructions
3. Maintain the same general structure and formatting
4. Preserve any key information that should be retained
5. Use MDX markdown format with appropriate heading levels and formatting
6. Limit to a maximum of 9 lines of content (including headings and bullet points)
7. VERY IMPORTANT: If the constraint involves a non-English language, use natural, native expressions in that language. Avoid direct translations that sound unnatural.

Return ONLY the edited MDX content for the slide, without any additional explanation.
`;
};

// For chat interactions without slide editing or creation
const createChatPrompt = (userPrompt: string) => {
  return `
### Chat Interaction
The user wants to have a conversation or ask a question rather than create or edit slides.

### User message:
"${userPrompt}"

### Instructions:
1. Respond to the user's question or message naturally, as PITCH MASTER
2. Provide helpful, knowledgeable information about presentations, pitches, slides, and storytelling
3. If the user is asking about how to create effective slides or presentations, offer expert advice
4. Keep your response concise, friendly, and valuable
5. Format any tips or advice in a clear, easy-to-read structure

Respond as PITCH MASTER would, maintaining your identity as the world's best storyteller and startup pitch creator.
`;
};

// Function to handle a chat interaction without slide creation/editing
async function handleChatInteraction(
  generationId: string,
  userPrompt: string
): Promise<string> {
  // Get current status or create a new one with empty phaseContent
  const initialStatus = statusStore.get(generationId) || {
    id: generationId,
    status: 'understanding',
    progress: 0,
    message: 'Processing your request...',
    phaseContent: {}
  };
  
  console.log("Chat interaction requested...");
  
  // Update status
  statusStore.set(generationId, {
    ...initialStatus,
    status: 'generating',
    progress: 50,
    message: 'Generating response...'
  });
  
  const chatPrompt = createChatPrompt(userPrompt);
  
  // Store the chat prompt in phaseContent
  const currentStatus = statusStore.get(generationId);
  if (currentStatus) {
    const updatedPhaseContent = {
      ...(currentStatus.phaseContent),
      planning: chatPrompt
    };
    
    console.log("Updating planning phase content in chat interaction, keys:", Object.keys(updatedPhaseContent));
    
    statusStore.set(generationId, {
      ...currentStatus,
      phaseContent: updatedPhaseContent
    });
  }
  
  const chatResult = await generateText({
    model: typhoon(TYPHOON_MODEL),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: chatPrompt },
    ],
    temperature: 0.7,
  });
  
  // Store the chat response in phaseContent
  const statusAfterGeneration = statusStore.get(generationId);
  if (statusAfterGeneration) {
    const updatedPhaseContent = {
      ...(statusAfterGeneration.phaseContent),
      generating: [chatResult.text]
    };
    
    console.log("Updating generating phase content in chat interaction, keys:", Object.keys(updatedPhaseContent));
    
    statusStore.set(generationId, {
      ...statusAfterGeneration,
      phaseContent: updatedPhaseContent
    });
  }
  
  const result = cleanedCodeBlock(chatResult.text);
  
  // Update status to completed
  const finalStatus = statusStore.get(generationId);
  statusStore.set(generationId, {
    ...(finalStatus || initialStatus),
    status: 'completed',
    progress: 100,
    message: 'Chat response complete',
    result,
    phaseContent: finalStatus?.phaseContent
  });
  
  console.log("Chat interaction complete");
  return result;
}

// Function to directly edit a slide without the multi-step process
async function directSlideEdit(
  generationId: string,
  userPrompt: string, 
  slideConstraint: string, 
  slideContext: string
): Promise<string> {
  // Get current status or create a new one with empty phaseContent
  const initialStatus = statusStore.get(generationId) || {
    id: generationId,
    status: 'understanding',
    progress: 0,
    message: 'Processing your request...',
    phaseContent: {}
  };
  
  console.log("Direct slide edit requested...");
  
  // Update status to planning
  statusStore.set(generationId, {
    ...initialStatus,
    status: 'planning',
    progress: 20,
    message: 'Planning slide edits...'
  });
  
  const editPrompt = createDirectEditPrompt(userPrompt, slideConstraint, slideContext);
  
  // Store planning phase content (the prompt in this case)
  const currentStatusAfterPlanning = statusStore.get(generationId);
  if (currentStatusAfterPlanning) {
    const updatedPhaseContent = {
      ...(currentStatusAfterPlanning.phaseContent),
      planning: editPrompt
    };
    
    console.log("Updating planning phase content in directSlideEdit, keys:", Object.keys(updatedPhaseContent));
    
    statusStore.set(generationId, {
      ...currentStatusAfterPlanning,
      phaseContent: updatedPhaseContent
    });
  }
  
  // Get updated status for generating phase
  const statusBeforeGeneration = statusStore.get(generationId);
  
  // Update status to generating
  statusStore.set(generationId, {
    ...statusBeforeGeneration!,
    status: 'generating',
    progress: 50,
    message: 'Generating edited slide content...'
  });
  
  const editResult = await generateText({
    model: typhoon(TYPHOON_MODEL),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: editPrompt },
    ],
    temperature: 0.7,
  });
  
  // Store generating phase content
  const currentStatusAfterGenerating = statusStore.get(generationId);
  if (currentStatusAfterGenerating) {
    const updatedPhaseContent = {
      ...(currentStatusAfterGenerating.phaseContent),
      generating: [editResult.text]
    };
    
    console.log("Updating generating phase content in directSlideEdit, keys:", Object.keys(updatedPhaseContent));
    
    statusStore.set(generationId, {
      ...currentStatusAfterGenerating,
      phaseContent: updatedPhaseContent
    });
  }
  
  const result = cleanedCodeBlock(editResult.text);
  
  // Get final status for completed state
  const finalStatus = statusStore.get(generationId);
  
  // Update status to completed
  statusStore.set(generationId, {
    ...(finalStatus || initialStatus),
    status: 'completed',
    progress: 100,
    message: 'Slide edit complete',
    result,
    phaseContent: finalStatus?.phaseContent
  });
  
  console.log("Direct slide edit complete");
  return result;
}

// Handle GET requests to check generation status
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      { error: "Generation ID is required" },
      { status: 400 }
    );
  }
  
  const status = statusStore.get(id);
  
  if (!status) {
    return NextResponse.json(
      { error: "Generation not found" },
      { status: 404 }
    );
  }
  
  // Log status details including phaseContent
  console.log(`GET status for id ${id}:`, {
    id: status.id,
    status: status.status,
    progress: status.progress,
    hasPhaseContent: !!status.phaseContent,
    phaseContent: status.phaseContent,
    phaseContentKeys: status.phaseContent ? Object.keys(status.phaseContent) : [],
  });
  console.log('status', status)
  
  return NextResponse.json(status);
}

// Handle DELETE requests to cancel generation
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      { error: "Generation ID is required" },
      { status: 400 }
    );
  }
  
  const status = statusStore.get(id);
  
  if (!status) {
    return NextResponse.json(
      { error: "Generation not found" },
      { status: 404 }
    );
  }
  
  // Only allow cancellation if not already complete or error
  if (status.status === 'completed' || status.status === 'error') {
    return NextResponse.json(
      { error: "Cannot cancel completed or failed generation" },
      { status: 400 }
    );
  }
  
  // Update the status to indicate cancellation
  statusStore.set(id, {
    ...status,
    status: 'error',
    progress: 0,
    message: 'Generation cancelled by user',
    error: 'User cancelled the operation'
  });
  
  return NextResponse.json({ 
    success: true, 
    message: "Generation cancelled successfully" 
  });
}

// Extract parameters directly if they're provided without waiting for asynchronous extraction
async function extractParametersDirectly(
  generationId: string,
  userPrompt: string, 
  userPersona: string, 
  slideGoal: string, 
  slideConstraint: string, 
  task: string,
  slideContext?: string
): Promise<void> {
  try {
    // Parameters were provided directly
    
    // For chat tasks, handle as conversation
    if (task === "chat") {
      console.log("Processing chat task...");
      await handleChatInteraction(generationId, userPrompt);
    }
    // For edit tasks, use direct editing workflow
    else if (task === "edit" && slideContext) {
      console.log("Processing edit task...");
      await directSlideEdit(generationId, userPrompt, slideConstraint, slideContext);
    } else {
      // For create tasks (or edit without context), run the full generation process
      await runFullSlideGeneration(
        generationId,
        userPrompt, 
        userPersona, 
        slideGoal, 
        slideConstraint,
        task,
        slideContext || ""
      );
    }
  } catch (error) {
    console.error("Error during direct parameters extraction:", error);
    statusStore.set(generationId, {
      id: generationId,
      status: 'error',
      progress: 0,
      message: 'Failed to process with direct parameters',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Handle POST requests to initiate generation
export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { userPrompt, slideContext } = requestData;
    const { userPersona, slideGoal, slideConstraint, task } = requestData;
    let { generationId } = requestData;
    
    if (!userPrompt) {
      return NextResponse.json(
        { error: "User prompt is required" },
        { status: 400 }
      );
    }
    
    // Generate a unique ID for this generation if not provided
    if (!generationId) {
      generationId = generateId();
    }
    
    // Set initial status
    statusStore.set(generationId, {
      id: generationId,
      status: 'understanding',
      progress: 0,
      message: 'Processing your request...',
      phaseContent: {}
    });
    
    // Extract parameters from the prompt if they weren't provided - now runs async
    if (!userPersona || !slideGoal || !slideConstraint) {
      console.log("Extracting parameters from user prompt...");
      
      // Start the extraction process asynchronously
      extractParametersFromPrompt(generationId, userPrompt, slideContext)
        .then(extractedParams => {
          // Only use extracted values if the corresponding parameters weren't provided
          const finalUserPersona = userPersona || extractedParams.userPersona;
          const finalSlideGoal = slideGoal || extractedParams.slideGoal;
          const finalSlideConstraint = slideConstraint || extractedParams.slideConstraint;
          const finalTask = task || extractedParams.task;
          
          console.log("Final parameters after extraction:", { finalUserPersona, finalSlideGoal, finalSlideConstraint, finalTask });
          
          // For chat tasks, handle as conversation
          if (finalTask === "chat") {
            console.log("Processing chat task...");
            handleChatInteraction(generationId, userPrompt)
              .catch(error => {
                console.error("Error during chat interaction:", error);
                statusStore.set(generationId, {
                  id: generationId,
                  status: 'error',
                  progress: 0,
                  message: 'Failed to respond to chat',
                  error: error.message
                });
              });
          }
          // For edit tasks, use direct editing workflow
          else if (finalTask === "edit" && slideContext) {
            console.log("Processing edit task...");
            directSlideEdit(generationId, userPrompt, finalSlideConstraint, slideContext)
              .catch(error => {
                console.error("Error during direct slide edit:", error);
                statusStore.set(generationId, {
                  id: generationId,
                  status: 'error',
                  progress: 0,
                  message: 'Failed to edit slide',
                  error: error.message
                });
              });
          } else {
            // For create tasks (or edit without context), run the full generation process
            runFullSlideGeneration(
              generationId,
              userPrompt, 
              finalUserPersona, 
              finalSlideGoal, 
              finalSlideConstraint,
              finalTask,
              slideContext || ""
            ).catch(error => {
              console.error("Error during slide generation:", error);
              statusStore.set(generationId, {
                id: generationId,
                status: 'error',
                progress: 0,
                message: 'Failed to generate slides',
                error: error.message
              });
            });
          }
        })
        .catch(error => {
          console.error("Error extracting parameters:", error);
          statusStore.set(generationId, {
            id: generationId,
            status: 'error',
            progress: 0,
            message: 'Failed to understand request',
            error: error.message
          });
        });
    } else {
      // Parameters were provided directly, run synchronously but handle errors
      extractParametersDirectly(
        generationId,
        userPrompt,
        userPersona,
        slideGoal,
        slideConstraint,
        task,
        slideContext
      );
    }
    
    // Return immediately with the generation ID for polling
    return NextResponse.json({ generationId });
  
  } catch (error) {
    console.error("Error handling generation request:", error);
    return NextResponse.json(
      { error: "Failed to process generation request" },
      { status: 500 }
    );
  }
}
