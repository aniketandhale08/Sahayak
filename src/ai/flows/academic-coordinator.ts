
'use server';

/**
 * @fileOverview An AI coordinator agent that orchestrates sub-agents to perform academic research.
 *
 * This agent analyzes a seminal paper topic, finds recent citing papers, and suggests
 * future research directions by invoking specialized tools.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// == Sub-agent Tool: academic_websearch ==
const RecentPaperSchema = z.object({
  title: z.string().describe("The title of the recent paper."),
  authors: z.array(z.string()).describe("The authors of the paper."),
  year: z.number().describe("The publication year."),
  source: z.string().describe("The journal or conference where it was published."),
  url: z.string().url().describe("A direct link to the paper (e.g., DOI or ArXiv)."),
});
export type RecentPaper = z.infer<typeof RecentPaperSchema>;

const recentPapersSearchTool = ai.defineTool(
  {
    name: 'recentPapersSearch',
    description: 'Finds recent academic papers that cite a seminal work or topic.',
    inputSchema: z.object({ topic: z.string() }),
    outputSchema: z.array(RecentPaperSchema),
  },
  async ({ topic }) => {
    console.log(`Searching for recent papers related to: ${topic}`);
    // This is a mock implementation. In a real scenario, this would call an academic search API.
    return [
      {
        title: `Advances in ${topic.split(' ').pop()}`,
        authors: ['A. Researcher', 'B. Scholar'],
        year: 2024,
        source: 'Journal of Modern AI',
        url: 'https://example.com/paper1',
      },
      {
        title: `A New Framework for ${topic}`,
        authors: ['C. Innovator'],
        year: 2023,
        source: 'AI Conference Proceedings',
        url: 'https://example.com/paper2',
      },
    ];
  }
);


// == Sub-agent Tool: academic_newresearch ==
const ResearchDirectionSchema = z.object({
    area: z.string().describe("The title or name of the research direction."),
    description: z.string().describe("A brief rationale or description for this potential research area."),
});
type ResearchDirection = z.infer<typeof ResearchDirectionSchema>;

const FutureResearchInputSchema = z.object({
    seminalTopic: z.string(),
    recentPapers: z.array(RecentPaperSchema),
});

const newResearchPrompt = `
Role: You are an AI Research Foresight Agent.

Inputs:

Seminal Paper: Information identifying a key foundational paper (e.g., Title, Authors, Abstract, DOI, Key Contributions Summary).
{seminal_paper}
Recent Papers Collection: A list or collection of recent academic papers
(e.g., Titles, Abstracts, DOIs, Key Findings Summaries) that cite, extend, or are significantly related to the seminal paper.
{recent_citing_papers}

Core Task:

Analyze & Synthesize: Carefully analyze the core concepts and impact of the seminal paper.
Then, synthesize the trends, advancements, identified gaps, limitations, and unanswered questions presented in the collection of recent papers.
Identify Future Directions: Based on this synthesis, extrapolate and identify underexplored or novel avenues for future research that logically
 extend from or react to the trajectory observed in the provided papers.

Output Requirements:

Generate a list of at least 3 distinct future research areas.
Focus Criteria: Each proposed area must meet the following criteria:
Novelty: Represents a significant departure from current work, tackles questions not yet adequately addressed,
or applies existing concepts in a genuinely new context evident from the provided inputs. It should be not yet fully explored.
Future Potential: Shows strong potential to be impactful, influential, interesting, or disruptive within the field in the coming years.
Diversity Mandate: Ensure the portfolio of suggestions reflects a good balance across different types of potential future directions.
Specifically, aim to include a mix of areas characterized by:
High Potential Utility: Addresses practical problems, has clear application potential, or could lead to significant real-world benefits.
Unexpectedness / Paradigm Shift: Challenges current assumptions, proposes unconventional approaches, connects previously disparate fields/concepts, or explores surprising implications.
Emerging Popularity / Interest: Aligns with growing trends, tackles timely societal or scientific questions, or opens up areas likely to attract significant research community interest.

Format: Present the research areas as a numbered list. For each area:
Provide a clear, concise Title or Theme.
Write a Brief Rationale (2-4 sentences) explaining:
What the research area generally involves.
Why it is novel or underexplored (linking back to the synthesis of the input papers).
Why it holds significant future potential (implicitly or explicitly touching upon its utility, unexpectedness, or likely popularity).
`;


const futureResearchSuggesterTool = ai.defineTool(
    {
        name: 'futureResearchSuggester',
        description: 'Suggests potential future research directions based on a seminal work and recent papers.',
        inputSchema: FutureResearchInputSchema,
        outputSchema: z.array(ResearchDirectionSchema),
    },
    async ({ seminalTopic, recentPapers }) => {
        console.log(`Generating research directions for: ${seminalTopic}`);

        const promptWithData = newResearchPrompt
            .replace('{seminal_paper}', seminalTopic)
            .replace('{recent_citing_papers}', JSON.stringify(recentPapers, null, 2));

        const llmResponse = await ai.generate({
            model: 'googleai/gemini-2.0-flash',
            prompt: promptWithData,
            output: {
                schema: z.object({
                    researchDirections: z.array(ResearchDirectionSchema)
                })
            }
        });

        return llmResponse.output?.researchDirections || [];
    }
);


// == Coordinator Agent ==
const AcademicCoordinatorInputSchema = z.object({
  topic: z.string().describe('The seminal paper, topic, or abstract to research.'),
});
export type AcademicCoordinatorInput = z.infer<typeof AcademicCoordinatorInputSchema>;

const AcademicCoordinatorOutputSchema = z.object({
  report: z.string().describe('A comprehensive, multi-section academic report in Markdown format.'),
});
export type AcademicCoordinatorOutput = z.infer<typeof AcademicCoordinatorOutputSchema>;


export async function runAcademicCoordinator(
  input: AcademicCoordinatorInput
): Promise<AcademicCoordinatorOutput> {
  return academicCoordinatorFlow(input);
}


const academicCoordinatorFlow = ai.defineFlow(
  {
    name: 'academicCoordinatorFlow',
    inputSchema: AcademicCoordinatorInputSchema,
    outputSchema: AcademicCoordinatorOutputSchema,
  },
  async (input) => {
    // SYSTEM PROMPT FOR THE COORDINATOR
    const coordinatorSystemPrompt = `
        System Role: You are an AI Research Assistant. Your primary function is to analyze a seminal paper topic provided by the user and
        then help the user explore the recent academic landscape evolving from it. You achieve this by analyzing the seminal paper,
        finding recent citing papers using the 'recentPapersSearch' tool, and suggesting future research directions using the
        'futureResearchSuggester' tool based on the findings.

        Workflow:

        1.  **Analyze Seminal Paper:**
            -   Given the user's topic: "${input.topic}".
            -   First, provide a brief analysis of this topic. Create a concise summary, list key topics/keywords, and list up to 5 key innovations or contributions.

        2.  **Find Recent Citing Papers (Using recentPapersSearch):**
            -   Next, invoke the \`recentPapersSearch\` tool to find recent papers related to the topic.

        3.  **Suggest Future Research Directions (Using futureResearchSuggester):**
            -   Then, invoke the \`futureResearchSuggester\` tool. Use the original topic and the list of papers you just found as input for the tool.

        4.  **Synthesize Final Report:**
            -   Finally, compile all the generated information into a single, comprehensive report in Markdown format.
            -   The report MUST have the following sections: "Seminal Paper Analysis", "Recent Citing Papers", and "Potential Future Research Directions".
            -   Present the information clearly under these headings. For recent papers and research directions, use bulleted or numbered lists.
    `;

    const llmResponse = await ai.generate({
      prompt: `Please perform the tasks outlined in the system prompt for the topic: "${input.topic}"`,
      system: coordinatorSystemPrompt,
      tools: [recentPapersSearchTool, futureResearchSuggesterTool],
      model: 'googleai/gemini-2.0-flash',
    });

    return {
      report: llmResponse.text,
    };
  }
);
