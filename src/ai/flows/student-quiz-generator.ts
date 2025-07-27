
'use server';

/**
 * @fileOverview AI-powered quiz generator for student assessment.
 *
 * - generateQuiz - A function that generates a quiz based on the given topic or lesson content.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import {ai} from '@/ai/genkit';
import {MediaPart} from 'genkit';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The topic or lesson content to generate a quiz for.'),
  gradeLevel: z.string().optional().describe('The grade level of the students taking the quiz.'),
  numberOfQuestions: z.number().int().min(1).max(10).default(5).describe('The number of questions to generate for the quiz.'),
  language: z.string().describe('The language for the quiz questions and answers.'),
  image: z.string().optional().describe(
    "An optional image for context, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
    question: z.string(),
    options: z.array(z.string()),
    answer: z.string(),
});

const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;


export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}


const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const prompt: (string | MediaPart)[] = [
      {
        text: `You are an AI quiz generator designed to create quizzes for teachers.

        Based on the topic, grade level, and image (if provided), generate a quiz with the specified number of questions.
        The quiz questions, options, and answers MUST be in the following language: ${input.language}.
        The quiz MUST be formatted in a valid JSON structure.
        The JSON object should have a single key "questions" which is an array of question objects.
        Each question object should have three keys: "question" (string), "options" (array of four strings), and "answer" (string that is one of the options).

        Topic: ${input.topic}
        Grade Level: ${input.gradeLevel}
        Number of Questions: ${input.numberOfQuestions}

        Quiz (JSON):
        `
      }
    ];

    if (input.image) {
      prompt.push({ media: { url: input.image } });
    }

    const {output} = await ai.generate({
      prompt: prompt,
      output: {
        schema: z.object({
            quiz: GenerateQuizOutputSchema
        })
      }
    });

    return output!.quiz;
  }
);
