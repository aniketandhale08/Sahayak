
"use client";
import { conceptImageGenerator } from "@/ai/flows/concept-image-generator";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { OutputActions } from "./output-actions";

const formSchema = z.object({
  conceptDescription: z.string().min(10, { message: "Concept description must be at least 10 characters." }),
  grade: z.string({ required_error: "Please select a grade level." }),
  subject: z.string().min(2, { message: "Subject must be at least 2 characters." }),
  language: z.string().min(2, { message: "Language is required."}),
});

type FormValues = z.infer<typeof formSchema>;

type Step = {
  stepDescription: string;
  imageUrl: string;
};

export function ImageGenerator() {
  const [result, setResult] = useState<Step[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { conceptDescription: "", subject: "", language: "English" },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const output = await conceptImageGenerator(data);
      setResult(output.steps);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const printableContent = result ? result.map(r => r.stepDescription).join('\n\n') : '';

  return (
    <>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="conceptDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concept to Visualize</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., The process of mitosis, Newton's third law of motion..." {...field} rows={4} />
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
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Literature, Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
              Generate Images
            </Button>
          </form>
        </Form>
      </CardContent>

      {(isLoading || result) && (
        <CardFooter className="flex-col items-start space-y-4">
          <h3 className="font-semibold text-lg">Generated Concept Steps:</h3>
          {isLoading ? (
            <Carousel className="w-full">
              <CarouselContent>
                {Array.from({ length: 3 }).map((_, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                        <div className="flex flex-col h-full p-4 border rounded-lg gap-4">
                          <Skeleton className="w-full aspect-video rounded-md" />
                          <Skeleton className="w-4/5 h-6" />
                        </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          ) : (
            result && (
              <div className="w-full">
                <Carousel opts={{ align: "start", loop: true }} className="w-full mb-4">
                  <CarouselContent>
                    {result.map((step, index) => (
                      <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-1 h-full">
                            <div className="flex flex-col h-full p-4 border rounded-lg bg-muted">
                              <div className="relative w-full aspect-video mb-4">
                                  <Image src={step.imageUrl} alt={step.stepDescription} fill objectFit="cover" className="rounded-md bg-white" />
                              </div>
                              <p className="text-sm font-medium text-foreground flex-1">{step.stepDescription}</p>
                            </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
                <OutputActions content={printableContent} />
              </div>
            )
          )}
        </CardFooter>
      )}
    </>
  );
}
