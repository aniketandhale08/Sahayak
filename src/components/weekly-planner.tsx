
"use client";
import { generateWeeklyPlan, WeeklyTeachingPlanOutput } from "@/ai/flows/weekly-teaching-planner";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ReactMarkdown from 'react-markdown';
import { Skeleton } from "./ui/skeleton";
import { OutputActions } from "./output-actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

const formSchema = z.object({
  teacherName: z.string().min(2, "Teacher name is required."),
  teacherEmail: z.string().email("Please enter a valid email."),
  teacherAvailability: z.string().min(10, "Please describe availability."),
  subject: z.string().min(2, "Subject is required."),
  className: z.string().min(2, "Class/Grade is required."),
  teachingGoals: z.string().min(10, { message: "Teaching goals must be at least 10 characters." }),
  constraints: z.string().min(10, { message: "Constraints must be at least 10 characters." }),
  language: z.string().min(2, { message: "Language is required."}),
});

type FormValues = z.infer<typeof formSchema>;

export function WeeklyPlanner() {
  const [result, setResult] = useState<WeeklyTeachingPlanOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
        teacherName: "", 
        teacherEmail: "",
        teacherAvailability: "",
        subject: "",
        className: "",
        teachingGoals: "", 
        constraints: "", 
        language: "English" 
    },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const output = await generateWeeklyPlan(data);
      setResult(output);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate weekly plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="teacherName" render={({ field }) => ( <FormItem><FormLabel>Teacher Name</FormLabel><FormControl><Input placeholder="e.g., Mr. Smith" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="teacherEmail" render={({ field }) => ( <FormItem><FormLabel>Teacher Email</FormLabel><FormControl><Input placeholder="e.g., mr.smith@school.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="subject" render={({ field }) => ( <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g., Biology" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="className" render={({ field }) => ( <FormItem><FormLabel>Class / Grade</FormLabel><FormControl><Input placeholder="e.g., Grade 10" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
             <FormField
                control={form.control}
                name="teacherAvailability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teacher's Weekly Availability</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Mon-Fri 9am-3pm, unavailable Tuesday afternoons..." {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="teachingGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teaching Goals for the Week</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Cover chapter 5 of algebra, introduce photosynthesis..." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="constraints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Constraints or Special Considerations</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., 45-minute periods, school assembly on Friday, limited access to lab..." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Spanish, French, Japanese" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Weekly Plan
            </Button>
          </form>
        </Form>
      </CardContent>
      {(isLoading || result) && (
        <CardFooter className="flex-col items-start gap-4">
          {isLoading ? (
              <div className="w-full p-4 border rounded-lg bg-muted space-y-4">
                  <Skeleton className="w-1/3 h-8" />
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-4/5 h-4" />
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-2/3 h-4" />
              </div>
          ) : (
              result && (
                <div className="w-full">
                  <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-li:text-foreground dark:prose-invert p-4 border rounded-lg bg-muted mb-4">
                    <ReactMarkdown>{result.readablePlan}</ReactMarkdown>
                  </div>
                   <Accordion type="single" collapsible className="w-full mb-4">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>View JSON Output</AccordionTrigger>
                        <AccordionContent>
                          <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                            <code>{JSON.stringify(result.jsonPlan, null, 2)}</code>
                          </pre>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  <OutputActions content={result.readablePlan} title="Weekly Teaching Plan" />
                </div>
              )
          )}
        </CardFooter>
      )}
    </>
  );
}
