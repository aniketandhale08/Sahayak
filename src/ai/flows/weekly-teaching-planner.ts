
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a weekly teaching plan based on teacher input.
 *
 * - generateWeeklyPlan - A function that generates a weekly teaching plan.
 * - WeeklyTeachingPlanInput - The input type for the generateWeeklyPlan function.
 * - WeeklyTeachingPlanOutput - The return type for the generateWeeklyPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeeklyTeachingPlanInputSchema = z.object({
  teacherName: z.string().describe("The name of the teacher."),
  teacherEmail: z.string().describe("The email address of the teacher."),
  teacherAvailability: z.string().describe("The teacher's available time slots for the week."),
  subject: z.string().describe("The subject being taught."),
  className: z.string().describe("The class or grade level."),
  teachingGoals: z
    .string()
    .describe('The teaching goals for the week, including topics and desired learning outcomes.'),
  constraints: z
    .string()
    .describe(
      'Any constraints or limitations for the week, such as time restrictions or resource limitations.'
    ),
  language: z.string().describe('The language for the output.'),
});
export type WeeklyTeachingPlanInput = z.infer<typeof WeeklyTeachingPlanInputSchema>;

const DayPlanSchema = z.object({
    day: z.string().describe("Day of the week (e.g., Monday)"),
    topic: z.string().describe("Main topic for the day."),
    activities: z.array(z.string()).describe("List of activities planned for the day."),
    assignments: z.string().describe("Homework or assignments for the day."),
});

const WeeklyTeachingPlanOutputSchema = z.object({
  readablePlan: z
    .string()
    .describe('A detailed weekly teaching plan in a human-readable Markdown format.'),
  jsonPlan: z.object({
      teacherName: z.string(),
      teacherEmail: z.string(),
      subject: z.string(),
      className: z.string(),
      week: z.array(DayPlanSchema),
  }).describe("The weekly plan in a structured JSON format."),
});
export type WeeklyTeachingPlanOutput = z.infer<typeof WeeklyTeachingPlanOutputSchema>;

export async function generateWeeklyPlan(
  input: WeeklyTeachingPlanInput
): Promise<WeeklyTeachingPlanOutput> {
  return weeklyTeachingPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weeklyTeachingPlanPrompt',
  input: {schema: WeeklyTeachingPlanInputSchema},
  output: {schema: WeeklyTeachingPlanOutputSchema},
  prompt: `You are an AI assistant designed to help teachers create weekly teaching plans.

  Based on the provided teacher details, goals, and constraints, generate a detailed weekly plan. 
  The entire plan must be in the following language: {{{language}}}.

  Teacher Name: {{{teacherName}}}
  Teacher Email: {{{teacherEmail}}}
  Class: {{{className}}}
  Subject: {{{subject}}}
  Teacher's Availability: {{{teacherAvailability}}}
  
  Teaching Goals: {{{teachingGoals}}}
  Constraints: {{{constraints}}}

  Your output must contain two formats:
  1. 'readablePlan': A well-structured and human-readable plan using Markdown for formatting.
  2. 'jsonPlan': A structured JSON object representing the plan with details for each day of the week.
  `,
});

const weeklyTeachingPlanFlow = ai.defineFlow(
  {
    name: 'weeklyTeachingPlanFlow',
    inputSchema: WeeklyTeachingPlanInputSchema,
    outputSchema: WeeklyTeachingPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
