
"use server";

/**
 * @fileOverview An AI agent that evaluates a student's quiz answers and provides feedback.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const QuizQuestionSchema = z.object({
    question: z.string(),
    options: z.array(z.string()),
    answer: z.string(),
});

const StudentPerformanceInputSchema = z.object({
  quizQuestions: z.array(QuizQuestionSchema).describe("The full list of quiz questions, options, and correct answers."),
  studentAnswers: z.array(z.string()).describe("The list of answers submitted by the student, in the same order as the questions."),
});
export type StudentPerformanceInput = z.infer<typeof StudentPerformanceInputSchema>;

const StudentPerformanceOutputSchema = z.object({
  report: z.string().describe("A comprehensive performance report in Markdown format, including feedback and an improvement plan."),
});
export type StudentPerformanceOutput = z.infer<typeof StudentPerformanceOutputSchema>;

export async function evaluateStudentAnswers(
  input: StudentPerformanceInput
): Promise<StudentPerformanceOutput> {
  return studentPerformanceEvaluatorFlow(input);
}


const studentPerformanceEvaluatorFlow = ai.defineFlow(
  {
    name: 'studentPerformanceEvaluatorFlow',
    inputSchema: StudentPerformanceInputSchema,
    outputSchema: StudentPerformanceOutputSchema,
  },
  async (input) => {
    const evaluationPrompt = `You are an expert AI teaching assistant. Your task is to analyze a student's quiz performance and provide a detailed, encouraging, and constructive report.

    Here are the quiz questions and the student's submitted answers.
    ---
    QUIZ CONTENT AND STUDENT ANSWERS:
    ${input.quizQuestions.map((q, i) => `
    Question ${i + 1}: ${q.question}
    Options: ${q.options.join(', ')}
    Correct Answer: ${q.answer}
    Student's Answer: ${input.studentAnswers[i]}
    `).join('\n')}
    ---

    Based on this data, please generate a performance report in Markdown format. The report MUST include the following sections:

    1.  **Overall Performance**: Start with a brief, encouraging summary of the results. Calculate the final score (e.g., "You answered X out of Y questions correctly for a score of Z%.").
    2.  **Correct Answers**: List the questions the student answered correctly.
    3.  **Areas for Review**: List the questions the student answered incorrectly. For each incorrect answer, briefly explain *why* the correct answer is right.
    4.  **Identified Weak Points**: Based on the incorrect answers, identify any patterns or specific topics where the student seems to be struggling.
    5.  **Personalized Improvement Plan**: Provide a short, actionable list of 2-3 suggestions to help the student improve in their weak areas. This could include recommending specific types of problems to practice, concepts to review, or learning strategies.

    Your tone should be supportive and aimed at helping the student learn, not just grading them.`;

    const { text } = await ai.generate({
      prompt: evaluationPrompt,
    });

    return {
      report: text,
    };
  }
);
