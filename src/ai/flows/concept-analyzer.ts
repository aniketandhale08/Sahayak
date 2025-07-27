
'use server';

/**
 * @fileOverview An AI agent that analyzes a concept and breaks it down into video scenes with explanations.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';


const SceneSchema = z.object({
    sceneTitle: z.string().describe("The title for this specific step or scene."),
    videoPrompt: z.string().describe("A detailed prompt for a video generation model to create a consistent illustration for this scene."),
    explanation: z.string().describe("A concise, grade-appropriate explanation for this scene, suitable for narration."),
});

const ConceptAnalysisSchema = z.object({
  title: z.string().describe("A creative and descriptive title for the overall concept video series."),
  scenes: z.array(SceneSchema).describe("An array of scenes that break down the concept."),
});

export type ConceptAnalysis = z.infer<typeof ConceptAnalysisSchema>;

const AnalyzeConceptInputSchema = z.object({
  concept: z.string().min(10).describe('The complex concept to be explained in video.'),
  grade: z.string().describe('The grade level of the target audience.'),
  subject: z.string().describe('The subject of the concept.'),
  language: z.string().describe('The language for the output.'),
});
export type AnalyzeConceptInput = z.infer<typeof AnalyzeConceptInputSchema>;

export async function analyzeConceptForVideo(input: AnalyzeConceptInput): Promise<ConceptAnalysis> {
    return conceptAnalysisFlow(input);
}


const conceptAnalysisFlow = ai.defineFlow(
    {
        name: 'conceptAnalysisFlow',
        inputSchema: AnalyzeConceptInputSchema,
        outputSchema: ConceptAnalysisSchema,
    },
    async (input) => {
        const analysisResponse = await ai.generate({
            prompt: `You are an expert educator and instructional designer. Your task is to analyze a complex concept and break it down into a series of 3-5 simple, sequential video scenes that are easy for a student to understand.

            For each scene, provide a short, descriptive title, a detailed video generation prompt, and a concise explanation of that step. The explanation should be written in a clear, narrative style suitable for a voice-over.
            
            Ensure all generated text (titles, prompts, and explanations) is in the specified language.

            Concept: "${input.concept}"
            Grade Level: ${input.grade}
            Subject: ${input.subject}
            Language: ${input.language}
            Art Style: Clean, vibrant, minimalist educational animation style. Use simple shapes and clear labels where appropriate.
    
            Produce a structured analysis based on the above.`,
            output: {
                schema: ConceptAnalysisSchema
            }
        });

        const conceptAnalysis = analysisResponse.output;
        if (!conceptAnalysis) {
            throw new Error("Failed to analyze the concept.");
        }
        return conceptAnalysis;
    }
);
