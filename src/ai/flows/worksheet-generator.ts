
'use server';

/**
 * @fileOverview An AI agent that generates worksheets from an image of a lesson or poem.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {MediaPart} from 'genkit';


const WorksheetGeneratorInputSchema = z.object({
  grade: z.string().describe('The grade level of the students.'),
  subject: z.string().describe('The subject of the lesson material.'),
  language: z.string().describe('The language for the output worksheets.'),
  worksheetCount: z.number().int().min(1).max(5).describe('The number of different worksheets to generate.'),
  image: z.string().describe(
    "An image of the lesson or poem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type WorksheetGeneratorInput = z.infer<typeof WorksheetGeneratorInputSchema>;


const WorksheetSchema = z.object({
    title: z.string().describe("A descriptive title for the worksheet."),
    type: z.string().describe("The type of worksheet (e.g., 'Multiple Choice', 'Fill-in-the-Blanks', 'Short Answer Questions')."),
    content: z.string().describe("The full content of the worksheet in Markdown format."),
});

const WorksheetGeneratorOutputSchema = z.object({
  worksheets: z.array(WorksheetSchema).describe('An array of generated worksheets.'),
});
export type WorksheetGeneratorOutput = z.infer<typeof WorksheetGeneratorOutputSchema>;


export async function generateWorksheets(
  input: WorksheetGeneratorInput
): Promise<WorksheetGeneratorOutput> {
  return worksheetGeneratorFlow(input);
}


const worksheetGeneratorFlow = ai.defineFlow(
  {
    name: 'worksheetGeneratorFlow',
    inputSchema: WorksheetGeneratorInputSchema,
    outputSchema: WorksheetGeneratorOutputSchema,
  },
  async (input) => {
    
    const prompt: (string | MediaPart)[] = [
      {
        text: `You are an expert curriculum designer and teacher. Your task is to analyze the provided image containing a lesson, story, or poem and generate a set of diverse worksheets for students.

        Generate exactly ${input.worksheetCount} different worksheets. Make them varied and engaging. For example, you can create multiple choice questions, fill-in-the-blanks, short answer questions, matching exercises, or vocabulary definitions.
        
        Tailor the difficulty and style of the worksheets to the specified grade level and subject.
        The entire output, including titles and all content, must be in the following language: ${input.language}.
        Format each worksheet with a clear title, a description of the worksheet type, and the content in well-structured Markdown.

        Grade Level: ${input.grade}
        Subject: ${input.subject}
        Number of Worksheets: ${input.worksheetCount}

        Analyze the following image and produce the structured worksheet output:
        `
      },
      { media: { url: input.image } }
    ];

    const { output } = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.0-flash',
      output: {
        schema: WorksheetGeneratorOutputSchema,
      },
    });

    if (!output?.worksheets || output.worksheets.length === 0) {
        throw new Error("The AI failed to generate any worksheets. Please try a different image or prompt.");
    }

    return output;
  }
);
