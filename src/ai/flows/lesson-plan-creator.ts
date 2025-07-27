
'use server';

/**
 * @fileOverview A multi-agent AI that creates a comprehensive lesson plan.
 *
 * This agent orchestrates other specialized agents to gather teaching methods,
 * generate visual aids, and create quizzes, then synthesizes them into a
 * complete lesson plan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { teachingMethodExplainer } from './teaching-method-explainer';
import { generateQuiz } from './student-quiz-generator';
import { conceptImageGenerator } from './concept-image-generator';
import { MediaPart } from 'genkit';


const LessonPlanCreatorInputSchema = z.object({
  topic: z.string().describe('The central topic for the lesson plan.'),
  grade: z.string().describe('The grade level of the students.'),
  subject: z.string().describe('The subject of the lesson.'),
  language: z.string().describe('The language for the output.'),
  image: z.string().optional().describe(
    "An optional image for context, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type LessonPlanCreatorInput = z.infer<typeof LessonPlanCreatorInputSchema>;

const LessonPlanCreatorOutputSchema = z.object({
  lessonPlan: z.string().describe('The complete, synthesized lesson plan.'),
  imageUrl: z.string().describe('A relevant image URL for the lesson.'),
});
export type LessonPlanCreatorOutput = z.infer<typeof LessonPlanCreatorOutputSchema>;

export async function createLessonPlan(
  input: LessonPlanCreatorInput
): Promise<LessonPlanCreatorOutput> {
  return lessonPlanCreatorFlow(input);
}

const lessonPlanCreatorFlow = ai.defineFlow(
  {
    name: 'lessonPlanCreatorFlow',
    inputSchema: LessonPlanCreatorInputSchema,
    outputSchema: LessonPlanCreatorOutputSchema,
  },
  async (input) => {
    console.log('Orchestrator started for topic:', input.topic);

    // Step 1: Delegate tasks to specialized agents in parallel
    const [methodsResponse, quizResponse, imageResponse] = await Promise.all([
      teachingMethodExplainer({
        content: input.topic,
        grade: input.grade,
        subject: input.subject,
        language: input.language,
        image: input.image,
      }),
      generateQuiz({
        topic: input.topic,
        gradeLevel: input.grade,
        numberOfQuestions: 3,
        language: input.language,
        image: input.image,
      }),
      conceptImageGenerator({
        conceptDescription: input.topic,
        grade: input.grade,
        subject: input.subject,
        language: input.language,
      }),
    ]);
    
    const imageUrl = imageResponse.steps[0]?.imageUrl || '';

    // Step 2: Synthesize the results into a comprehensive lesson plan
    console.log('Synthesizing results from all agents...');
    const synthesisPromptText = `You are a master educator responsible for creating a final, comprehensive lesson plan.
    You have received input from several specialized AI agents. Your task is to synthesize this information into a single, cohesive, and well-structured lesson plan document.
    The entire lesson plan must be in the following language: ${input.language}.
    If an image was provided as part of the input, make sure to incorporate it into the lesson plan, for example by creating activities or discussion points around it.

    Topic: ${input.topic}
    Grade Level: ${input.grade}
    Subject: ${input.subject}

    Here is the information from your assistant agents:

    1.  **Suggested Teaching Methods & Activities:**
        ${methodsResponse.teachingMethods}

    2.  **Generated Assessment Quiz (in JSON format):**
        ${quizResponse.quiz}

    Please create a lesson plan that includes:
    - A clear title.
    - Learning objectives.
    - A list of materials (mentioning the generated image and the user-provided image if applicable).
    - A step-by-step procedure for the lesson, incorporating the suggested activities.
    - The assessment quiz you've received. Please reformat the quiz from JSON into a readable list of questions with options and clearly mark the correct answer.
    - A concluding summary.

    Format the entire output as a clean, readable document. Use headings, lists, and bold text for structure. Do NOT use markdown code blocks (\`\`\`).`;

    const prompt: (string | MediaPart)[] = [{ text: synthesisPromptText }];
    if (input.image) {
      prompt.push({ media: { url: input.image }});
    }

    const synthesisResponse = await ai.generate({
      prompt: prompt,
    });

    return {
      lessonPlan: synthesisResponse.text,
      imageUrl: imageUrl,
    };
  }
);
