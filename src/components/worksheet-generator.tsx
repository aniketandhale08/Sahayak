
"use client";

import { generateWorksheets } from "@/ai/flows/worksheet-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Skeleton } from "./ui/skeleton";
import ReactMarkdown from 'react-markdown';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { OutputActions } from "./output-actions";

const formSchema = z.object({
  grade: z.string({ required_error: "Please select a grade level." }),
  subject: z.string().min(2, "Subject is required."),
  language: z.string().min(2, "Language is required."),
  worksheetCount: z.coerce.number().int().min(1).max(5).default(3),
  image: z.string({ required_error: "An image of the lesson is required." }),
});

type FormValues = z.infer<typeof formSchema>;

interface Worksheet {
  title: string;
  type: string;
  content: string;
}

export function WorksheetGenerator() {
  const [result, setResult] = useState<Worksheet[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: "", language: "English", worksheetCount: 3 },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        form.setValue("image", dataUrl);
        setPreviewImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const output = await generateWorksheets(data);
      setResult(output.worksheets);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Generating Worksheets",
        description: error instanceof Error ? error.message : "The AI agent failed to generate worksheets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const printableContent = result ? result.map(ws => `## ${ws.title} (${ws.type})\\n\\n${ws.content}`).join('\\n\\n---\\n\\n') : '';

  return (
    <>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="image" render={() => (
                <FormItem>
                    <FormLabel>Lesson/Poem Image</FormLabel>
                    <FormControl>
                        <div className="flex flex-col gap-4 items-center justify-center p-4 border-2 border-dashed rounded-lg">
                            {previewImage ? (
                                <Image src={previewImage} alt="Lesson Preview" width={400} height={300} className="rounded-md object-contain max-h-60" />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <Upload className="mx-auto h-12 w-12" />
                                    <p>Upload an image of the lesson or poem.</p>
                                </div>
                            )}
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}> <Upload className="mr-2" /> Upload Image</Button>
                        </div>
                    </FormControl>
                    <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    <FormMessage />
                </FormItem>
            )} />

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="grade" render={({ field }) => ( <FormItem><FormLabel>Grade Level</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select a grade" /> </SelectTrigger> </FormControl> <SelectContent> {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => ( <SelectItem key={grade} value={`Grade ${grade}`}>Grade {grade}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="subject" render={({ field }) => ( <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g., Literature, Science" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>

            <FormField control={form.control} name="language" render={({ field }) => ( <FormItem><FormLabel>Language</FormLabel><FormControl><Input placeholder="e.g., Spanish, French, Japanese" {...field} /></FormControl><FormMessage /></FormItem> )} />
           
            <FormField
              control={form.control}
              name="worksheetCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Worksheets</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a count" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(num => (
                        <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Worksheets
            </Button>
          </form>
        </Form>
      </CardContent>

      {(isLoading || result) && (
        <CardFooter className="flex-col items-start w-full gap-4">
            <h3 className="font-semibold text-lg">Generated Worksheets:</h3>
            {isLoading ? (
                 <div className="w-full space-y-4">
                    <Skeleton className="w-1/3 h-8" />
                    <Skeleton className="w-full h-40" />
                 </div>
            ) : result && (
                <div className="w-full">
                    <Carousel opts={{ align: "start", loop: false }} className="w-full mb-4">
                        <CarouselContent>
                            {result.map((ws, index) => (
                                <CarouselItem key={index}>
                                    <div className="p-1 h-full">
                                        <Card className="flex flex-col h-full bg-muted/50">
                                            <CardHeader>
                                                <CardTitle>{ws.title}</CardTitle>
                                                <p className="text-sm text-muted-foreground">{ws.type}</p>
                                            </CardHeader>
                                            <CardContent className="prose prose-sm max-w-none dark:prose-invert flex-grow">
                                                <ReactMarkdown>{ws.content}</ReactMarkdown>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                    <OutputActions content={printableContent} title="Generated Worksheets" />
                </div>
            )}
        </CardFooter>
      )}
    </>
  );
}
