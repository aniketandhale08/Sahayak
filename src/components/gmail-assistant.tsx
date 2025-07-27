
"use client";

import { runGmailAssistant } from "@/ai/flows/gmail-assistant";
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
  prompt: z.string().min(10, { message: "Prompt must be at least 10 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

export function GmailAssistant() {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: "" },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const output = await runGmailAssistant(data);
      setResult(output.response);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Running Agent",
        description: error instanceof Error ? error.message : "The Gmail agent failed to generate a response. Please try again.",
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
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Request</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., Send a reminder to the team about the meeting tomorrow at 10am." {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Request
          </Button>
        </form>
      </Form>

      {(isLoading || result) && (
        <Card>
          <CardHeader>
            <CardTitle>Assistant's Response</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="w-1/3 h-8" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-4/5 h-4" />
              </div>
            ) : (
              result && (
                <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-li:text-foreground dark:prose-invert">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              )
            )}
          </CardContent>
           {result && (
            <CardFooter>
              <OutputActions content={result} title="Gmail Assistant Response" />
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
