
'use server';

/**
 * @fileOverview A Calendar assistant agent that uses a tool to post events to an n8n webhook.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const N8N_WEBHOOK_URL = 'https://n8n-aptask-com-u23220.vm.elestio.app/webhook/4009c9dc-dddd-47d3-b4a4-23de4bd518b3';

// Define the tool that will post data to the n8n webhook.
const addCalendarEventFromText = ai.defineTool(
  {
    name: 'addCalendarEventFromText',
    description: 'Takes a text description of a calendar event and sends it to a service to be created.',
    inputSchema: z.object({
      eventText: z.string().describe("The full text description of the event to be created, e.g., 'Team meeting tomorrow at 2pm about the Q3 report'"),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        message: z.string(),
    }),
  },
  async ({ eventText }) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: eventText }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Webhook failed with status ${response.status}: ${errorBody}`);
        }
        
        console.log('Successfully sent event to n8n webhook.');
        return { success: true, message: `Event "${eventText}" was successfully sent to the calendar.` };

    } catch (error) {
        console.error('Error sending data to webhook:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to send event to calendar: ${errorMessage}` };
    }
  }
);


const CalendarAssistantInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for the calendar assistant.'),
});
export type CalendarAssistantInput = z.infer<typeof CalendarAssistantInputSchema>;

const CalendarAssistantOutputSchema = z.object({
  response: z.string().describe('The assistant\'s response or the result of the action.'),
});
export type CalendarAssistantOutput = z.infer<typeof CalendarAssistantOutputSchema>;

export async function runCalendarAssistant(
  input: CalendarAssistantInput
): Promise<CalendarAssistantOutput> {
  return calendarAssistantFlow(input);
}


const calendarAssistantFlow = ai.defineFlow(
  {
    name: 'calendarAssistantFlow',
    inputSchema: CalendarAssistantInputSchema,
    outputSchema: CalendarAssistantOutputSchema,
  },
  async ({ prompt }) => {

    const systemPrompt = `You are a helpful calendar assistant.
    Your task is to understand the user's request and use the 'addCalendarEventFromText' tool to create a calendar event via a webhook.
    You must call the tool to create the event. Do not just say you've created it.
    If the tool returns a success message, report that back to the user.
    If the tool returns a failure message, report the error to the user.`;

    const llmResponse = await ai.generate({
      prompt: prompt,
      system: systemPrompt,
      tools: [addCalendarEventFromText],
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
