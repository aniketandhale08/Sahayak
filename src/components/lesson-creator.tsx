
"use client";
import { createLessonPlan } from "@/ai/flows/lesson-plan-creator";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileImage, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Skeleton } from "./ui/skeleton";
import ReactMarkdown from 'react-markdown';
import { OutputActions } from "./output-actions";


const formSchema = z.object({
  topic: z.string().min(5, { message: "Topic must be at least 5 characters." }),
  grade: z.string({ required_error: "Please select a grade level." }),
  subject: z.string().min(2, { message: "Subject must be at least 2 characters." }),
  language: z.string().min(2, { message: "Language is required."}),
  image: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LessonPlanResult {
  lessonPlan: string;
  imageUrl: string;
}

export function LessonCreator() {
  const [result, setResult] = useState<LessonPlanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: "", subject: "", language: "English" },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const output = await createLessonPlan(data);
      setResult(output);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Creating Lesson Plan",
        description: "The multi-agent coordinator failed. Please try again.",
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
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Topic</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., The American Revolution, Photosynthesis..." {...field} />
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
                      <Input placeholder="e.g., History, Biology" {...field} />
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
            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                  <FormLabel>Optional Image</FormLabel>
                  <FormControl>
                      <div className="flex items-center gap-4">
                          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                              <FileImage className="mr-2" /> Upload Image
                          </Button>
                          <Input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              accept="image/*"
                              onChange={handleImageChange} 
                          />
                          {previewImage && <Image src={previewImage} alt="Preview" width={48} height={48} className="rounded-md object-cover" />}
                      </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Lesson Plan
            </Button>
          </form>
        </Form>
      </CardContent>

      {(isLoading || result) && (
        <CardFooter className="flex-col items-start w-full gap-4">
            {isLoading ? (
                <div className="w-full p-4 space-y-4">
                    <Skeleton className="w-1/3 h-8" />
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-4/5 h-4" />
                    <div className="flex justify-center py-4">
                        <Skeleton className="w-64 h-48" />
                    </div>
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-2/3 h-4" />
                </div>
            ) : (
                result && (
                <div className="w-full space-y-6">
                    {result.imageUrl && (
                        <div className="flex justify-center py-4">
                            <Image 
                                src={result.imageUrl} 
                                alt="Lesson Visual Aid" 
                                width={400} 
                                height={400} 
                                className="rounded-lg shadow-md bg-white"
                                data-ai-hint="lesson concept"
                            />
                        </div>
                    )}
                    <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-li:text-foreground dark:prose-invert p-4 border rounded-lg bg-muted w-full">
                        <ReactMarkdown>{result.lessonPlan}</ReactMarkdown>
                    </div>
                    <OutputActions content={result.lessonPlan} title="Lesson Plan" />
                </div>
                )
            )}
        </CardFooter>
      )}
    </>
  );
}
