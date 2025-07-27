
'use server';

/**
 * @fileOverview An AI agent that conducts academic research on a given topic.
 *
 * This agent uses a web search tool to gather information and then synthesizes
 * it into a structured academic report.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the schema for the web search tool's output.
const SearchResultSchema = z.object({
  title: z.string().describe('The title of the search result.'),
  url: z.string().url().describe('The URL of the search result.'),
  snippet: z.string().describe('A brief snippet of the content.'),
});
type SearchResult = z.infer<typeof SearchResultSchema>;

// Define the input for the research agent.
const AcademicResearchAgentInputSchema = z.object({
  topic: z.string().describe('The academic topic to research.'),
});
export type AcademicResearchAgentInput = z.infer<typeof AcademicResearchAgentInputSchema>;

// Define the output for the research agent.
const AcademicResearchAgentOutputSchema = z.object({
  report: z.string().describe('A structured academic research report in Markdown format.'),
  references: z.array(z.object({
      title: z.string(),
      url: z.string().url(),
  })).describe('A list of academic sources used for the report.'),
});
export type AcademicResearchAgentOutput = z.infer<typeof AcademicResearchAgentOutputSchema>;

// Define a mock web search tool that returns academic-style results.
const webSearchTool = ai.defineTool(
  {
    name: 'academicWebSearch',
    description: 'Performs a web search for the given query and returns a list of academic-focused results.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(SearchResultSchema),
  },
  async ({ query }) => {
    console.log(`Performing mock academic search for: ${query}`);
    // In a real application, this would call a specialized search API (e.g., Google Scholar, Semantic Scholar).
    // For this prototype, we'll return a set of mock academic results.
    return [
      {
        title: `The Foundational Principles of ${query}`,
        url: `https://arxiv.org/abs/2401.12345`,
        snippet: `A foundational paper on ${query} published in a leading academic journal, exploring its theoretical underpinnings and implications for future research.`,
      },
      {
        title: `A Longitudinal Study on the Effects of ${query}`,
        url: `https://www.jstor.org/stable/12345`,
        snippet: `This study, conducted over ten years, provides empirical evidence on the long-term impact of ${query} in a controlled environment.`,
      },
      {
        title: `Cross-Disciplinary Applications of ${query}`,
        url: `https://www.university.edu/research/paper-on-${query.toLowerCase().replace(/\s+/g, '-')}`,
        snippet: `A university research paper that details the novel applications of ${query} in fields ranging from computer science to sociology.`,
      },
    ];
  }
);

// The main exported function that clients will call.
export async function runAcademicResearchAgent(input: AcademicResearchAgentInput): Promise<AcademicResearchAgentOutput> {
  return academicResearchAgentFlow(input);
}


const academicResearchAgentFlow = ai.defineFlow(
  {
    name: 'academicResearchAgentFlow',
    inputSchema: AcademicResearchAgentInputSchema,
    outputSchema: AcademicResearchAgentOutputSchema,
  },
  async (input) => {
    // Step 1: Use the tool to perform the search.
    const searchResponse = await ai.generate({
      prompt: `Use the academic web search tool to find information about "${input.topic}".`,
      tools: [webSearchTool],
      model: 'gemini-2.5-pro', // Specify a model that supports tool use.
    });
    
    const searchResults = searchResponse.toolCalls(webSearchTool.name).map(call => call.output) as SearchResult[][];
    const flatResults = searchResults.flat();
    
    if (flatResults.length === 0) {
      return {
        report: "I couldn't find any academic information on that topic. Please try a different query.",
        references: [],
      };
    }

    // Step 2: Synthesize the results into an academic report.
    const synthesisPrompt = `You are a research analyst specializing in creating academic summaries.
    Synthesize the following search results into a formal academic report on the topic: "${input.topic}".
    
    The report must be well-structured, written in a formal academic tone, and formatted in Markdown. It must include the following sections:
    1.  **Abstract**: A brief summary of the entire report.
    2.  **Introduction**: Background and context of the topic.
    3.  **Key Findings**: A synthesis of the main points from the search results, presented in a logical flow.
    4.  **Conclusion**: A summary of the findings and potential implications or future research directions.
    5.  **References**: A list of the sources used.
    
    Search Results:
    ${flatResults.map(r => `### ${r.title}\n**URL:** ${r.url}\n**Snippet:** ${r.snippet}`).join('\n\n')}
    `;

    const synthesisResponse = await ai.generate({
      prompt: synthesisPrompt,
    });

    return {
      report: synthesisResponse.text,
      references: flatResults.map(r => ({ title: r.title, url: r.url })),
    };
  }
);
