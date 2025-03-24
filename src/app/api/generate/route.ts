import { NextResponse } from "next/server";
import { generateText } from "ai";

// Import Typhoon client utility
import { typhoon } from "@/lib/typhoon";


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
const SYSTEM_PROMPT = `You are PITCH MASTER, the world's best storyteller and startup pitch creator.

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

// Step 1: Planning - determine content structure based on user persona and slide goal
const createPlanningPrompt = (userPrompt: string, userPersona: string, slideGoal: string, slideConstraint: string, task: string, slideContext?: string) => {
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
  console.log('final slides', slides)
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
    model: typhoon("llm"),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: extractionPrompt },
    ],
    temperature: 0.5,
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
    model: typhoon("llm"),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: contentPrompt },
    ],
    temperature: 0.7,
  });
  
  return cleanedCodeBlock(contentResult.text);
}

// Function to extract parameters from the user prompt
async function extractParametersFromPrompt(userPrompt: string, slideContext?: string): Promise<{
  userPersona: string;
  slideGoal: string;
  slideConstraint: string;
  task: string;
}> {
  const extractionPrompt = `
### Parameter Extraction Task
I need you to analyze the following user prompt and slideContext for a slide presentation and extract key parameters.

### Existing slide context:
${slideContext}

### General constraints:
- No images, no tables
- If a specific language is requested, the content should use natural expressions in that language, not direct translations

### User prompt:
"${userPrompt}"

### Instructions:
Extract the following information from the user prompt and general constraints:
1. User Persona: Who is the target audience for this presentation? What kind of professionals are they?
2. Slide Goal: What is the main objective of this presentation? (e.g., persuade, inform, entertain, sell)
3. Slide Constraint: Are there any specific constraints mentioned? (e.g., language requirements, time limits, style preferences, no images, no tables)
   - If a language constraint is identified, add that the content should "use natural expressions in that language that sound native, not direct translations"
4. Task: Is the user requesting a new presentation or editing/refined an existing one?

If any of these parameters are not explicitly mentioned in the prompt, make a reasonable inference based on the content.

Return ONLY a JSON object with the following format:
{
  "userPersona": "Description of the target audience",
  "slideGoal": "Primary objective of the presentation",
  "slideConstraint": "Any constraints that should be considered, including natural language usage for non-English content",
  "task": "create|edit"
}
`;

  const extractionResult = await generateText({
    model: typhoon("llm"),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: extractionPrompt },
    ],
    temperature: 0.3,
  });
  
  try {
    const extractedParams = JSON.parse(cleanedCodeBlock(extractionResult.text));
    console.log("Extracted parameters:", extractedParams);
    return extractedParams;
  } catch (parseError) {
    console.error("Error parsing extracted parameters:", parseError);
    // Return default values if parsing fails
    return {
      userPersona: "",
      slideGoal: "",
      slideConstraint: "",
      task: ""
    };
  }
}

// Function to run the complete three-step process
async function runFullSlideGeneration(
  userPrompt: string, 
  userPersona: string = "", 
  slideGoal: string = "",
  slideConstraint: string = "",
  task: string = "",
  slideContext: string = ""
): Promise<string> {
  console.log("Step 1: Planning presentation structure...");
  console.log('slideContext', slideContext)
  // Step 1: Create the plan
  const planningPrompt = createPlanningPrompt(userPrompt, userPersona, slideGoal, slideConstraint, task, slideContext);
  console.log('planningPrompt', planningPrompt)
  const planResult = await generateText({
    model: typhoon("llm"),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: planningPrompt },
    ],
    temperature: 0.7,
  });
  // Parse the slide plan
  let slidePlan: SlidePlan;
  try {
    slidePlan = JSON.parse(cleanedCodeBlock(planResult.text)) as SlidePlan;
    console.log(`Created plan with ${slidePlan.totalSlides} slides for "${slidePlan.title}"`);
  } catch (parseError) {
    console.error("Error parsing slide plan JSON:", parseError);
    throw new Error("Failed to parse slide plan result");
  }
  
  // Step 2: Generate each individual slide (now in two phases)
  console.log("Step 2: Generating individual slides (two-phase process)...");
  const slidePromises: Promise<string>[] = [];
  console.log(slidePlan)
  
  for (let i = 1; i <= slidePlan.totalSlides; i++) {
    slidePromises.push(generateSlide(slidePlan, i, userPrompt, slideConstraint));
  }
  
  const slides = await Promise.all(slidePromises);
  console.log(`Generated ${slides.length} individual slides`);
  // Step 3: Refine the presentation
  console.log("Step 3: Refining the complete presentation...");
  const refinementPrompt = createRefinementPrompt(slides, slidePlan, slideConstraint);
  const refinementResult = await generateText({
    model: typhoon("llm"),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: refinementPrompt },
    ],
    temperature: 0.7,
  });
  
  console.log("Slide generation complete");
  return cleanedCodeBlock(refinementResult.text);
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

// Function to directly edit a slide without the multi-step process
async function directSlideEdit(userPrompt: string, slideConstraint: string, slideContext: string): Promise<string> {
  console.log("Performing direct slide edit...");
  
  const editPrompt = createDirectEditPrompt(userPrompt, slideConstraint, slideContext);
  
  const editResult = await generateText({
    model: typhoon("llm"),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: editPrompt },
    ],
    temperature: 0.7,
  });
  
  console.log("Slide edit complete");
  return cleanedCodeBlock(editResult.text);
}

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { userPrompt, slideContext } = requestData;
    let { userPersona, slideGoal, slideConstraint, task } = requestData;

    if (!userPrompt) {
      return NextResponse.json(
        { error: "User prompt is required" },
        { status: 400 }
      );
    }

    // Extract parameters from the prompt if they weren't provided
    if (!userPersona || !slideGoal || !slideConstraint) {
      console.log("Extracting parameters from user prompt...");
      const extractedParams = await extractParametersFromPrompt(userPrompt, slideContext);
      
      // Only use extracted values if the corresponding parameters weren't provided
      userPersona = userPersona || extractedParams.userPersona;
      slideGoal = slideGoal || extractedParams.slideGoal;
      slideConstraint = slideConstraint || extractedParams.slideConstraint;
      task = task || extractedParams.task;
      
      console.log("Final parameters after extraction:", { userPersona, slideGoal, slideConstraint, task });
    }

    // For edit tasks, use direct editing workflow
    if (task === "edit" && slideContext) {
      console.log("Processing edit task...");
      const editedSlide = await directSlideEdit(userPrompt, slideConstraint, slideContext);
      return NextResponse.json({ text: editedSlide });
    }

    // For create tasks (or edit without context), run the full generation process
    const finalPresentation = await runFullSlideGeneration(
      userPrompt, 
      userPersona, 
      slideGoal, 
      slideConstraint,
      task,
      slideContext || ""
    );
    
    // Return in the original format expected by the frontend
    return NextResponse.json({ text: finalPresentation });
  
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
