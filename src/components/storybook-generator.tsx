
"use client";
import { storybookGenerator } from "@/ai/flows/storybook-generator";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { OutputActions } from "./output-actions";

const formSchema = z.object({
  topic: z.string().min(5, { message: "Topic must be at least 5 characters." }),
  grade: z.string({ required_error: "Please select a grade level." }),
  language: z.string().min(2, { message: "Language is required."}),
});

type FormValues = z.infer<typeof formSchema>;

interface Page {
  text: string;
  imageUrl: string;
}

interface Storybook {
  title: string;
  pages: Page[];
}

export function StorybookGenerator() {
  const [result, setResult] = useState<Storybook | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: "", language: "English" },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const output = await storybookGenerator(data);
      setResult(output);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Generating Storybook",
        description: "Failed to generate the storybook. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const printableContent = result ? `${result.title}\n\n` + result.pages.map((p, i) => `Page ${i+1}:\n${p.text}`).join('\n\n') : '';


  return (
    <>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storybook Topic</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., The journey of a water molecule, A day in ancient Rome..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Grade Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a grade" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                            <SelectItem key={grade} value={`Grade ${grade}`}>Grade {grade}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
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
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Storybook
            </Button>
          </form>
        </Form>
      </CardContent>

      {(isLoading || result) && (
        <CardFooter className="flex-col items-start space-y-4">
            {isLoading ? (
                <div className="w-full space-y-4">
                    <Skeleton className="w-1/2 h-8 mx-auto" />
                    <Carousel className="w-full">
                        <CarouselContent>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <CarouselItem key={index} className="md:basis-1/2 lg:basis-4/5">
                                <div className="p-1">
                                    <div className="flex flex-col md:flex-row h-full p-4 border rounded-lg gap-4 items-center">
                                        <Skeleton className="w-full md:w-1/2 aspect-square rounded-md" />
                                        <div className="w-full md:w-1/2 space-y-2">
                                            <Skeleton className="w-full h-6" />
                                            <Skeleton className="w-4/5 h-6" />
                                            <Skeleton className="w-full h-6" />
                                        </div>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </div>
            ) : (
                result && (
                <div className="w-full space-y-4">
                    <h3 className="text-2xl font-bold text-center">{result.title}</h3>
                    <Carousel opts={{ align: "start", loop: true }} className="w-full mb-4">
                        <CarouselContent>
                        {result.pages.map((page, index) => (
                            <CarouselItem key={index} className="md:basis-4/5 lg:basis-3/4">
                                <div className="p-1 h-full">
                                    <div className="flex flex-col md:flex-row items-center h-full p-6 border rounded-lg bg-muted gap-6">
                                        <div className="relative w-full md:w-1/2 aspect-square">
                                            <Image src={page.imageUrl} alt={`Illustration for page ${index + 1}`} fill objectFit="cover" className="rounded-md bg-white" />
                                        </div>
                                        <p className="w-full md:w-1/2 text-base font-medium text-foreground leading-relaxed">{page.text}</p>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                    <OutputActions content={printableContent} title={result.title} />
                </div>
                )
            )}
        </CardFooter>
      )}
    </>
  );
}
