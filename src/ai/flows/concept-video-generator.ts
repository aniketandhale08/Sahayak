
'use server';

/**
 * @fileOverview An agent that generates a single concept video scene.
 *
 * - generateConceptVideoScene - A function that handles the concept video scene generation.
 * - GenerateConceptVideoSceneInput - The input type for the function.
 * - GenerateConceptVideoSceneOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const GenerateConceptVideoSceneInputSchema = z.object({
  videoPrompt: z.string().describe('A detailed prompt for the video generation model.'),
});
export type GenerateConceptVideoSceneInput = z.infer<typeof GenerateConceptVideoSceneInputSchema>;

const GenerateConceptVideoSceneOutputSchema = z.object({
    videoUrl: z.string().describe(
        'The URL of the generated video, as a data URI that must include a MIME type and use Base64 encoding.'
    ),
});
export type GenerateConceptVideoSceneOutput = z.infer<typeof GenerateConceptVideoSceneOutputSchema>;

export async function generateConceptVideoScene(
  input: GenerateConceptVideoSceneInput
): Promise<GenerateConceptVideoSceneOutput> {
  return generateConceptVideoSceneFlow(input);
}


const generateConceptVideoSceneFlow = ai.defineFlow(
  {
    name: 'generateConceptVideoSceneFlow',
    inputSchema: GenerateConceptVideoSceneInputSchema,
    outputSchema: GenerateConceptVideoSceneOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.GEMINI_API_KEY;

    let {operation} = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt: input.videoPrompt,
        config: {
            durationSeconds: 8,
            aspectRatio: '16:9',
        },
    });

    if (!operation) {
        throw new Error('Failed to start video generation operation.');
    }

    // Wait until the operation completes.
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
        operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
        throw new Error(`Failed to generate video. Error: ${operation.error.message}`);
    }

    const video = operation.output?.message?.content.find(p => !!p.media);
    if (!video || !video.media?.url) {
        throw new Error('Failed to find the generated video.');
    }
    
    const fetch = (await import('node-fetch')).default;
    const videoDownloadResponse = await fetch(`${video.media!.url}&key=${apiKey}`);
    if (!videoDownloadResponse.ok) {
        throw new Error(`Failed to download video: ${videoDownloadResponse.statusText}`);
    }
    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    const base64Video = Buffer.from(videoBuffer).toString('base64');
    const videoDataUrl = `data:video/mp4;base64,${base64Video}`;

    return { 
        videoUrl: videoDataUrl
    };
  }
);
