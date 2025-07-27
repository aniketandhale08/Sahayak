
'use server';

/**
 * @fileOverview An AI agent that generates illustrated storybooks.
 *
 * - storybookGenerator - A function that handles the storybook generation process.
 * - StorybookGeneratorInput - The input type for the storybookGenerator function.
 * - StorybookGeneratorOutput - The return type for the storybookGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StorybookGeneratorInputSchema = z.object({
  topic: z.string().describe('The topic or theme of the story.'),
  grade: z.string().describe('The grade level of the target audience.'),
  language: z.string().describe('The language for the story.'),
});
export type StorybookGeneratorInput = z.infer<typeof StorybookGeneratorInputSchema>;

const StorybookGeneratorOutputSchema = z.object({
  title: z.string().describe('The title of the storybook.'),
  pages: z.array(
    z.object({
      text: z.string().describe('The text for this page of the story.'),
      imageUrl: z.string().describe(
        'The URL of the generated illustration for this page, as a data URI that must include a MIME type and use Base64 encoding.'
      ),
    })
  ).describe('The pages of the storybook, each with text and an illustration.'),
});
export type StorybookGeneratorOutput = z.infer<typeof StorybookGeneratorOutputSchema>;

export async function storybookGenerator(
  input: StorybookGeneratorInput
): Promise<StorybookGeneratorOutput> {
  return storybookGeneratorFlow(input);
}

const storyGenerationPrompt = ai.definePrompt({
    name: 'storybookGenerationPrompt',
    input: { schema: StorybookGeneratorInputSchema },
    output: {
      schema: z.object({
        title: z.string().describe('The title of the storybook.'),
        pages: z.array(
          z.object({
            text: z.string().describe('The text for this page of the story.'),
            illustrationPrompt: z.string().describe('A detailed prompt for the illustrator to create an image for this page.'),
          })
        ).describe('A series of 5-7 pages for the storybook.'),
      }),
    },
    prompt: `You are an expert storyteller and educator. Your task is to create a short, engaging, and educational storybook for a student.

The story should be between 5 and 7 pages long.

Your story must be tailored to the student's grade level and written entirely in the following language: {{{language}}}.

Topic: {{{topic}}}
Grade Level: {{{grade}}}

Generate a title for the story and then generate the content for each page. For each page, provide the story text and a detailed prompt for an illustrator to create a vibrant, simple, and educational illustration that matches the text. The illustration prompt does not need to be in the target language.`,
});


const storybookGeneratorFlow = ai.defineFlow(
  {
    name: 'storybookGeneratorFlow',
    inputSchema: StorybookGeneratorInputSchema,
    outputSchema: StorybookGeneratorOutputSchema,
  },
  async (input) => {
    // Step 1: Generate the story content (title, pages with text and illustration prompts).
    const storyResponse = await storyGenerationPrompt(input);
    const storyData = storyResponse.output;

    if (!storyData || !storyData.pages || storyData.pages.length === 0) {
      throw new Error('Agent failed to generate story content.');
    }

    // Step 2: Generate an image for each page.
    const pagesWithImages = await Promise.all(
      storyData.pages.map(async (page) => {
        const { media } = await ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: page.illustrationPrompt,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });

        return {
          text: page.text,
          imageUrl: media?.url || '',
        };
      })
    );

    // Step 3: Return the final storybook with images.
    return { 
        title: storyData.title,
        pages: pagesWithImages 
    };
  }
);
