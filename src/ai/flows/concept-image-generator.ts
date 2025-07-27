
'use server';

/**
 * @fileOverview A concept image generation AI agent.
 *
 * - conceptImageGenerator - A function that handles the concept image generation process.
 * - ConceptImageGeneratorInput - The input type for the conceptImageGenerator function.
 * - ConceptImageGeneratorOutput - The return type for the conceptImageGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConceptImageGeneratorInputSchema = z.object({
  conceptDescription: z
    .string()
    .describe('The description of the concept, topic, or story to be explained.'),
  grade: z.string().describe('The grade level of the students.'),
  subject: z.string().describe('The subject of the topic.'),
  language: z.string().describe('The language for the output.'),
});
export type ConceptImageGeneratorInput = z.infer<typeof ConceptImageGeneratorInputSchema>;

const ConceptImageGeneratorOutputSchema = z.object({
  steps: z.array(
    z.object({
      stepDescription: z.string().describe('The description of the step, tailored for the specified grade and subject.'),
      imageUrl: z.string().describe(
        'The URL of the generated image for the step, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
      ),
    })
  ).describe('A series of 3 steps to explain the concept, with an image for each step.'),
});
export type ConceptImageGeneratorOutput = z.infer<typeof ConceptImageGeneratorOutputSchema>;

export async function conceptImageGenerator(
  input: ConceptImageGeneratorInput
): Promise<ConceptImageGeneratorOutput> {
  return conceptImageGeneratorFlow(input);
}

const stepGenerationPrompt = ai.definePrompt({
    name: 'conceptImageStepGenerationPrompt',
    input: { schema: ConceptImageGeneratorInputSchema },
    output: {
      schema: z.object({
        steps: z.array(
          z.object({
            stepDescription: z.string().describe('The description of the step, tailored for the specified grade and subject.'),
          })
        ).describe('A series of 3 steps to explain the concept.'),
      }),
    },
    prompt: `You are an expert educator and AI agent. Your task is to research and break down a complex concept, topic, or story into exactly 3 simple, easy-to-understand steps for a student.

Your research must consider the student's grade level and the subject to tailor the complexity of the language and the depth of the explanation.

The entire output, including all step descriptions, must be in the following language: {{{language}}}.

Topic/Story: {{{conceptDescription}}}
Grade Level: {{{grade}}}
Subject: {{{subject}}}

Generate a 3-step explanation. For each step, provide a clear and concise description.`,
});


const conceptImageGeneratorFlow = ai.defineFlow(
  {
    name: 'conceptImageGeneratorFlow',
    inputSchema: ConceptImageGeneratorInputSchema,
    outputSchema: ConceptImageGeneratorOutputSchema,
  },
  async (input) => {
    // Step 1: Generate the step-by-step descriptions.
    const stepResponse = await stepGenerationPrompt(input);
    const stepsData = stepResponse.output?.steps;

    if (!stepsData || stepsData.length === 0) {
      throw new Error('Agent failed to generate step descriptions.');
    }

    // Step 2: Generate an image for each step.
    const stepsWithImages = await Promise.all(
      stepsData.map(async (step) => {
        // Create a detailed prompt for the image generation model.
        const imagePrompt = `A simple, clear, and educational illustration for a ${input.grade} student studying ${input.subject}. The image should visually represent this concept: "${step.stepDescription}". Style: vibrant, simple, and easy-to-understand for educational purposes.`;
        
        const { media } = await ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: imagePrompt,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });

        // Combine the description and the generated image URL.
        return {
          stepDescription: step.stepDescription,
          imageUrl: media?.url || '', // Return the generated image URL, or an empty string if it fails.
        };
      })
    );

    // Step 3: Return the final combined output.
    return { steps: stepsWithImages };
  }
);
