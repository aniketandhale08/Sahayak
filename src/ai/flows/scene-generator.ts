
'use server';

/**
 * @fileOverview An AI agent that generates the assets for a single animated storybook scene.
 *
 * This agent creates audio narration and an animated video clip for one scene.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';
import {MediaPart} from 'genkit';


// Define Input Schema
const SceneInputSchema = z.object({
    narrationText: z.string(),
    illustrationPrompt: z.string(),
    characterSheetDataUri: z.string().optional(),
});
export type SceneInput = z.infer<typeof SceneInputSchema>;


// Define final output schema for the flow
const SceneOutputSchema = z.object({
  narrationAudio: z.string().describe("Data URI of the narrated audio for the scene."),
  videoUrl: z.string().describe("Data URI of the generated video for the scene."),
});
export type SceneOutput = z.infer<typeof SceneOutputSchema>;


// The main exported function that clients will call
export async function generateScene(input: SceneInput): Promise<SceneOutput> {
  return generateSceneFlow(input);
}


// Helper function to convert PCM audio from TTS to WAV format
async function toWav(
    pcmData: Buffer,
    channels = 1,
    rate = 24000,
    sampleWidth = 2
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const writer = new wav.Writer({
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });
  
      let bufs: any[] = [];
      writer.on('error', reject);
      writer.on('data', function (d) {
        bufs.push(d);
      });
      writer.on('end', function () {
        resolve(Buffer.concat(bufs).toString('base64'));
      });
  
      writer.write(pcmData);
      writer.end();
    });
}


const generateSceneFlow = ai.defineFlow(
  {
    name: 'generateSceneFlow',
    inputSchema: SceneInputSchema,
    outputSchema: SceneOutputSchema,
  },
  async (input) => {
    // === Step 1: Generate audio and video in parallel ===
    const [audioResult, videoResult] = await Promise.all([
        generateAudio(input.narrationText),
        generateVideo(input.illustrationPrompt, input.characterSheetDataUri),
    ]);

    return {
      narrationAudio: audioResult,
      videoUrl: videoResult,
    };
  }
);


async function generateAudio(narrationText: string): Promise<string> {
    const { media: narrationAudioMedia } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      prompt: narrationText,
      config: { responseModalities: ['AUDIO'] },
    });

    if (!narrationAudioMedia) throw new Error(`Failed to generate audio.`);
    
    const audioBuffer = Buffer.from(
        narrationAudioMedia.url.substring(narrationAudioMedia.url.indexOf(',') + 1), 'base64'
    );
    const wavAudioBase64 = await toWav(audioBuffer);
    return `data:audio/wav;base64,${wavAudioBase64}`;
}


async function generateVideo(illustrationPrompt: string, characterSheetDataUri?: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    
    const videoPrompt: (string | MediaPart)[] = [
        { text: `Animate this scene in a gentle, slow-panning Ken Burns style. Scene description: ${illustrationPrompt}` },
    ];
    if (characterSheetDataUri) {
      videoPrompt.push({ media: { url: characterSheetDataUri, contentType: 'image/png' } });
    }
    
    let { operation } = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt: videoPrompt,
        config: {
            durationSeconds: 8,
            aspectRatio: '16:9',
        },
    });
    
    if (!operation) throw new Error(`Failed to start video generation.`);

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
    }

    if (operation.error) throw new Error(`Video generation failed: ${operation.error.message}`);

    const videoPart = operation.output?.message?.content.find(p => !!p.media);
    if (!videoPart || !videoPart.media?.url) throw new Error(`Failed to find video.`);

    const fetch = (await import('node-fetch')).default;
    const videoDownloadResponse = await fetch(`${videoPart.media!.url}&key=${apiKey}`);
    if (!videoDownloadResponse.ok) {
        throw new Error(`Failed to download video: ${videoDownloadResponse.statusText}`);
    }
    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    const base64Video = Buffer.from(videoBuffer).toString('base64');
    return `data:video/mp4;base64,${base64Video}`;
}

// Separate flow for generating the character sheet to be called from the client
const CharacterSheetInputSchema = z.object({
  characterSheetPrompt: z.string(),
});
export type CharacterSheetInput = z.infer<typeof CharacterSheetInputSchema>;

const CharacterSheetOutputSchema = z.object({
  characterSheetDataUri: z.string(),
});
export type CharacterSheetOutput = z.infer<typeof CharacterSheetOutputSchema>;

export async function generateCharacterSheet(input: CharacterSheetInput): Promise<CharacterSheetOutput> {
    const { media: characterSheetImage } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: input.characterSheetPrompt,
        config: { responseModalities: ['TEXT', 'IMAGE'] },
    });
    const characterSheetDataUri = characterSheetImage?.url;
    if (!characterSheetDataUri) {
        throw new Error("Failed to generate character sheet.");
    }
    return { characterSheetDataUri };
};

// Separate flow for generating concept images
const ConceptImageInputSchema = z.object({
    prompt: z.string(),
});
export type ConceptImageInput = z.infer<typeof ConceptImageInputSchema>;

const ConceptImageOutputSchema = z.object({
    imageUrl: z.string(),
});
export type ConceptImageOutput = z.infer<typeof ConceptImageOutputSchema>;

export async function generateConceptImage(input: ConceptImageInput): Promise<ConceptImageOutput> {
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: input.prompt,
        config: { responseModalities: ['TEXT', 'IMAGE'] },
    });
    const imageUrl = media?.url;
    if (!imageUrl) {
        throw new Error("Image generation returned no media.");
    }
    return { imageUrl };
}
