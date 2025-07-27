
'use server';

/**
 * @fileOverview An AI agent that suggests simplified teaching methods based on input content, grade, and subject.
 *
 * - teachingMethodExplainer - A function that suggests teaching methods.
 * - TeachingMethodExplainerInput - The input type for the teachingMethodExplainer function.
 * - TeachingMethodExplainerOutput - The return type for the teachingMethodExplainer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {MediaPart} from 'genkit';

const TeachingMethodExplainerInputSchema = z.object({
  content: z.string().describe('The lesson content (text, image data URI, or voice data URI).'),
  grade: z.string().describe('The class grade level.'),
  subject: z.string().describe('The subject of the lesson.'),
  language: z.string().describe('The language for the output.'),
  image: z.string().optional().describe(
    "An optional image for context, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type TeachingMethodExplainerInput = z.infer<typeof TeachingMethodExplainerInputSchema>;

const TeachingMethodExplainerOutputSchema = z.object({
  teachingMethods: z
    .string()
    .describe('A list of suggested teaching methods tailored to the content and student level.'),
});
export type TeachingMethodExplainerOutput = z.infer<typeof TeachingMethodExplainerOutputSchema>;

export async function teachingMethodExplainer(input: TeachingMethodExplainerInput): Promise<TeachingMethodExplainerOutput> {
  return teachingMethodExplainerFlow(input);
}

const teachingMethodExplainerFlow = ai.defineFlow(
  {
    name: 'teachingMethodExplainerFlow',
    inputSchema: TeachingMethodExplainerInputSchema,
    outputSchema: TeachingMethodExplainerOutputSchema,
  },
  async (input) => {
    const prompt: (string | MediaPart)[] = [
      {
        text: `You are an experienced teacher. Given the lesson content, class grade, and subject, suggest a list of simplified and effective teaching methods.
        Analyze both the text and the image (if provided) to create your suggestions.
        The entire response must be in the following language: ${input.language}.
        Format the output as a clean, readable document. Use Markdown headings, lists, and bold text for structure. Do NOT use markdown code blocks (\`\`\`).

        Lesson Content: ${input.content}
        Class Grade: ${input.grade}
        Subject: ${input.subject}

        Here are some tailored teaching methods:
        `
      }
    ];

    if (input.image) {
      prompt.push({ media: { url: input.image } });
    }

    const { output } = await ai.generate({
      prompt: prompt,
      output: {
        schema: TeachingMethodExplainerOutputSchema,
      }
    });
    return output!;
  }
);
