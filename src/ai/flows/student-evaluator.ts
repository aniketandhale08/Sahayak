
"use server";

/**
 * @fileOverview An AI agent that evaluates a student's performance based on their quiz history.
 *
 * This agent retrieves student data from a mock service and uses it to generate
 * a performance summary and personalized recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getStudentResults, QuizResult } from '@/services/student-service';


const StudentEvaluationInputSchema = z.object({
  studentId: z.string().describe("The unique ID of the student to evaluate."),
  studentName: z.string().describe("The name of the student."),
});
export type StudentEvaluationInput = z.infer<typeof StudentEvaluationInputSchema>;

const StudentEvaluationOutputSchema = z.object({
  evaluationSummary: z.string().describe("A comprehensive summary of the student's performance, including strengths, weaknesses, and actionable recommendations, in Markdown format."),
});
export type StudentEvaluationOutput = z.infer<typeof StudentEvaluationOutputSchema>;

export async function evaluateStudentPerformance(
  input: StudentEvaluationInput
): Promise<StudentEvaluationOutput> {
  return studentEvaluatorFlow(input);
}


function formatQuizHistory(quizHistory: QuizResult[]): string {
    if (quizHistory.length === 0) {
        return "This student has not completed any quizzes yet.";
    }

    return quizHistory
        .map(result => {
            const date = result.savedAt && typeof result.savedAt.toDate === 'function' 
              ? result.savedAt.toDate().toLocaleDateString()
              : "Date not available";
            const questions = result.quizData.questions.map((q: any, i: number) => 
                `  ${i+1}. Question: ${q.question}\n     Answer: ${q.answer}`
            ).join('\n');
            return `Quiz on "${result.quizName}" (taken on ${date}):\n${questions}`;
        })
        .join('\n\n');
}


const studentEvaluatorFlow = ai.defineFlow(
  {
    name: 'studentEvaluatorFlow',
    inputSchema: StudentEvaluationInputSchema,
    outputSchema: StudentEvaluationOutputSchema,
  },
  async (input) => {
    // Step 1: Retrieve student's quiz history from the mock service
    const quizHistory = await getStudentResults(input.studentId);
    
    const formattedHistory = formatQuizHistory(quizHistory);

    // Step 2: Generate evaluation using the retrieved data
    const evaluationPrompt = `You are an expert educator and student performance analyst.
    Your task is to provide a comprehensive evaluation for a student named ${input.studentName}.
    Analyze their quiz history to identify patterns, strengths, and areas for improvement.

    Here is the student's quiz history:
    ---
    ${formattedHistory}
    ---

    Based on this data, please provide a detailed evaluation that includes:
    1.  **Overall Performance Summary**: A brief, paragraph-long overview of how the student is doing academically based on the quiz data.
    2.  **Identified Strengths**: Using a bulleted list, mention 2-3 specific topics or question types where the student excels.
    3.  **Areas for Improvement**: Using a bulleted list, mention 2-3 specific topics or concepts where the student seems to be struggling.
    4.  **Actionable Recommendations**: Provide a numbered list of 2-3 concrete next steps, learning strategies, or resources to help the student improve.

    Please format the entire output as a clean, readable document. Use Markdown headings (e.g., ###), lists, and bold text for structure. Do NOT use markdown code blocks (\`\`\`). Be encouraging and constructive in your tone.`;

    const { text } = await ai.generate({
      prompt: evaluationPrompt,
    });

    return {
      evaluationSummary: text,
    };
  }
);

    
