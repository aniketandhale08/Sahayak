
"use client";

import { runAcademicCoordinator, AcademicCoordinatorOutput } from "@/ai/flows/academic-coordinator";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ReactMarkdown from 'react-markdown';
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { OutputActions } from "./output-actions";

const formSchema = z.object({
  topic: z.string().min(10, { message: "Topic must be at least 10 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

export function AcademicCoordinatorAgent() {
  const [result, setResult] = useState<AcademicCoordinatorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: "" },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const output = await runAcademicCoordinator(data);
      setResult(output);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Running Agent",
        description: "The research agent failed to generate a report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seminal Paper Topic or Abstract</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., The impact of quantum computing on cryptography, The role of social media in political discourse..." {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Coordinator Agent
          </Button>
        </form>
      </Form>

      {(isLoading || result) && (
        <Card>
          <CardHeader>
            <CardTitle>Comprehensive Academic Report</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="w-1/3 h-8" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-4/5 h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-2/3 h-4" />
              </div>
            ) : (
              result && (
                <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-li:text-foreground dark:prose-invert">
                  <ReactMarkdown>{result.report}</ReactMarkdown>
                </div>
              )
            )}
          </CardContent>
           {result && (
            <CardFooter>
              <OutputActions content={result.report} title={`Research on ${form.getValues('topic')}`} />
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
