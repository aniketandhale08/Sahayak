
'use server';

/**
 * @fileOverview A Gmail assistant agent that uses a tool to post text to an n8n webhook.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const N8N_GMAIL_WEBHOOK_URL = 'https://n8n-aptask-com-u23220.vm.elestio.app/webhook/4009c9dc-dddd-47d3-b4a4-23de4bd518b3';

// Define the tool that will post data to the n8n webhook.
const sendTextToGmailWebhook = ai.defineTool(
  {
    name: 'sendTextToGmailWebhook',
    description: 'Takes a text prompt and sends it to a service to be processed by a Gmail workflow.',
    inputSchema: z.object({
      promptText: z.string().describe("The full text to be sent to the Gmail workflow, e.g., 'Remind the team about the Q3 report deadline.'"),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        message: z.string(),
    }),
  },
  async ({ promptText }) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(N8N_GMAIL_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: promptText }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Webhook failed with status ${response.status}: ${errorBody}`);
        }
        
        const responseBody = await response.json();
        console.log('Successfully sent prompt to n8n Gmail webhook.');
        // Assuming n8n responds with a message.
        const confirmationMessage = (responseBody as any)?.message || `Your request was successfully sent to the Gmail workflow.`;
        return { success: true, message: confirmationMessage };

    } catch (error) {
        console.error('Error sending data to webhook:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to send request to Gmail workflow: ${errorMessage}` };
    }
  }
);


const GmailAssistantInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for the Gmail assistant.'),
});
export type GmailAssistantInput = z.infer<typeof GmailAssistantInputSchema>;

const GmailAssistantOutputSchema = z.object({
  response: z.string().describe('The assistant\'s response or the result of the action.'),
});
export type GmailAssistantOutput = z.infer<typeof GmailAssistantOutputSchema>;

export async function runGmailAssistant(
  input: GmailAssistantInput
): Promise<GmailAssistantOutput> {
  return gmailAssistantFlow(input);
}


const gmailAssistantFlow = ai.defineFlow(
  {
    name: 'gmailAssistantFlow',
    inputSchema: GmailAssistantInputSchema,
    outputSchema: GmailAssistantOutputSchema,
  },
  async ({ prompt }) => {

    const systemPrompt = `You are a helpful assistant.
    Your task is to understand the user's request and use the 'sendTextToGmailWebhook' tool to send the user's prompt to a Gmail workflow.
    You must call the tool to send the request. Do not just say you've sent it.
    If the tool returns a success message, report that back to the user.
    If the tool returns a failure message, report the error to the user.`;

    const llmResponse = await ai.generate({
      prompt: prompt,
      system: systemPrompt,
      tools: [sendTextToGmailWebhook],
      model: 'googleai/gemini-1.5-flash-latest',
    });

    const toolCalls = llmResponse.toolCalls;
    
    if (toolCalls && toolCalls.length > 0) {
      console.log('Tool call(s) made:', JSON.stringify(toolCalls, null, 2));
      const toolOutput = toolCalls[0].output as { success: boolean; message: string; };
      return { response: toolOutput.message };
    }

    return {
      response: llmResponse.text,
    };
  }
);
