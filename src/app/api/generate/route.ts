import { NextResponse } from "next/server";
import { generateText } from "ai";

// Import Typhoon client utility
import { typhoon } from "@/lib/typhoon";

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

// Create a prompt with context and guidelines for MDX format
const createSlidePrompt = (userPrompt: string, slideContext: string) => {
  return `

### Current slide context:
${slideContext}

### Instructions:
I want you to create engaging MDX content for a slide presentation. Follow this two-step process:

STEP 1: First, think about the story and plan within <think>...</think> tags.
<think>
Plan the overall narrative and structure that would best communicate:
"${userPrompt}"

Consider:
- What's the main message or takeaway?
- Who is the audience and what would interest them most?
- Everything is a storytelling, make sure to include a story.
- Impactful stories are better than boring facts.
- Make the story relevant to the audience.
- What examples, metaphors or visuals might enhance understanding?
</think>

STEP 2: After your planning (outside of any tags), create the actual MDX slides following these guidelines:
1. Use MDX markdown format
2. Separate each slide with "---" (three dashes on a single line)
3. Use heading levels (#, ##, ###) appropriately
4. Include bullet points with "-" where appropriate
5. Use basic markdown formatting (bold, italic, lists) to enhance readability
6. Keep each slide focused on a single idea or topic
7. Make the content visually balanced and easy to scan
8. IMPORTANT: Limit each slide to a maximum of 9 lines of content (including headings and bullet points). If a slide exceeds 9 lines, split it into multiple slides.
9. Don't forget to add a cover slide with the title of the presentation and the name of the presenter.
`;
};

export async function POST(request: Request) {
  try {
    const { userPrompt, slideContext } = await request.json();

    if (!userPrompt) {
      return NextResponse.json(
        { error: "User prompt is required" },
        { status: 400 }
      );
    }

    // Create the full prompt with the user's input and slide context
    const prompt = createSlidePrompt(
      userPrompt,
      slideContext || "Current slide context: Empty slides or no slides yet."
    );

    // Generate content with Typhoon model instead of OpenAI
    const { text } = await generateText({
      model: typhoon("typhoon-v2-r1-70b-preview"),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
