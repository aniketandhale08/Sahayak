
'use server';

/**
 * @fileOverview A multi-agent AI system for grading handwritten student exams.
 *
 * This file contains a coordinator agent that orchestrates two sub-agents:
 * 1. Image Analysis Agent: Performs OCR on an exam paper image to extract text.
 * 2. Evaluation Agent: Grades the extracted text against a provided answer key.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { MediaPart } from 'genkit';


// == Sub-agent Tool 1: Image Analysis (OCR) ==
const ImageAnalysisOutputSchema = z.object({
    studentName: z.string().describe("The name of the student identified from the paper."),
    extractedText: z.string().describe("All of the handwritten text extracted from the exam paper."),
});

const imageAnalysisTool = ai.defineTool(
    {
        name: 'imageAnalysisTool',
        description: 'Analyzes an image of a handwritten exam paper to extract the student\'s name and all written text.',
        inputSchema: z.object({
            examImage: z.string().describe("The exam paper image as a data URI."),
        }),
        outputSchema: ImageAnalysisOutputSchema,
    },
    async ({ examImage }) => {
        console.log("Image Analysis Tool: Starting OCR process.");
        
        const prompt = `You are an expert OCR (Optical Character Recognition) system. Analyze the provided image of a student's exam paper.
        Your task is to identify the student's name and extract all the handwritten text from the answers.
        Prioritize accuracy. Structure the output clearly.`;

        const { output } = await ai.generate({
            model: 'googleai/gemini-2.0-flash',
            prompt: [
                { text: prompt },
                { media: { url: examImage } },
            ],
            output: {
                schema: ImageAnalysisOutputSchema,
            },
        });
        
        if (!output) {
            throw new Error("Image analysis failed to produce output.");
        }
        console.log(`Image Analysis Tool: Extracted text for student ${output.studentName}.`);
        return output;
    }
);


// == Sub-agent Tool 2: Evaluation ==
const EvaluationOutputSchema = z.object({
    score: z.number().describe("The calculated score for the exam."),
    feedback: z.string().describe("Constructive feedback and performance analysis for the student, referencing the answer key."),
});

const evaluationTool = ai.defineTool(
    {
        name: 'evaluationTool',
        description: 'Evaluates the student\'s extracted answers against a provided answer key, calculates a score, and provides feedback.',
        inputSchema: z.object({
            examTopic: z.string(),
            subject: z.string(),
            totalMarks: z.number(),
            extractedText: z.string(),
            answerKey: z.string().describe("The ground truth questions and answers for the exam."),
        }),
        outputSchema: EvaluationOutputSchema,
    },
    async ({ examTopic, subject, totalMarks, extractedText, answerKey }) => {
        console.log("Evaluation Tool: Starting grading process with answer key.");

        const prompt = `You are an expert teacher and examiner for the subject: ${subject}.
        You are grading an exam on the topic: "${examTopic}". The total marks possible are ${totalMarks}.

        You MUST use the following answer key as the absolute source of truth for grading.
        --- ANSWER KEY ---
        ${answerKey}
        --- END ANSWER KEY ---
        
        Below is the OCR-extracted text from a student's exam paper.
        --- STUDENT'S ANSWERS ---
        ${extractedText}
        --- END STUDENT'S ANSWERS ---

        Your task is to:
        1.  Carefully compare the student's answers to the provided answer key. Award partial marks where appropriate.
        2.  Determine a fair score out of ${totalMarks} based ONLY on the comparison with the answer key.
        3.  Write constructive, personalized feedback. This should include what the student did well, where they made mistakes (referencing the correct answers from the key), and specific, actionable suggestions for improvement.
        
        Provide only the score and the feedback.`;

         const { output } = await ai.generate({
            model: 'googleai/gemini-2.0-flash',
            prompt: prompt,
            output: {
                schema: EvaluationOutputSchema,
            },
        });

        if (!output) {
            throw new Error("Evaluation failed to produce output.");
        }
        console.log(`Evaluation Tool: Graded paper with score ${output.score}.`);
        return output;
    }
);


// == Coordinator Agent: Exam Grader ==
const ExamGraderInputSchema = z.object({
  examTopic: z.string(),
  className: z.string(),
  subject: z.string(),
  totalMarks: z.number(),
  answerKey: z.string().describe("The questions and correct answers for the exam."),
  examImage: z.string().describe("The exam paper image as a data URI."),
});
export type ExamGraderInput = z.infer<typeof ExamGraderInputSchema>;

const ExamGraderOutputSchema = z.object({
  studentName: z.string(),
  score: z.number(),
  totalMarks: z.number(),
  feedback: z.string(),
});
export type ExamGraderOutput = z.infer<typeof ExamGraderOutputSchema>;


export async function gradeExamPaper(
  input: ExamGraderInput
): Promise<ExamGraderOutput> {
  return examGraderFlow(input);
}


const examGraderFlow = ai.defineFlow(
  {
    name: 'examGraderFlow',
    inputSchema: ExamGraderInputSchema,
    outputSchema: ExamGraderOutputSchema,
  },
  async (input) => {
    console.log("Exam Grader Coordinator: Started.");

    // Step 1: Use the Image Analysis Tool to perform OCR.
    const analysisResult = await imageAnalysisTool({ examImage: input.examImage });

    // Step 2: Use the Evaluation Tool to grade the extracted text.
    const evaluationResult = await evaluationTool({
        examTopic: input.examTopic,
        subject: input.subject,
        totalMarks: input.totalMarks,
        extractedText: analysisResult.extractedText,
        answerKey: input.answerKey,
    });

    // Step 3: Synthesize and return the final result.
    console.log("Exam Grader Coordinator: Finished.");
    return {
      studentName: analysisResult.studentName,
      score: evaluationResult.score,
      totalMarks: input.totalMarks,
      feedback: evaluationResult.feedback,
    };
  }
);
