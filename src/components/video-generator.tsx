
"use client";
import { analyzeConceptForVideo, ConceptAnalysis } from "@/ai/flows/concept-analyzer";
import { generateConceptVideoScene, GenerateConceptVideoSceneOutput } from "@/ai/flows/concept-video-generator";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  concept: z.string().min(10, { message: "Concept must be at least 10 characters." }),
  grade: z.string({ required_error: "Please select a grade level." }),
  subject: z.string().min(2, { message: "Subject must be at least 2 characters." }),
  language: z.string().min(2, { message: "Language is required."}),
});

type FormValues = z.infer<typeof formSchema>;

type SceneState = {
  sceneTitle: string;
  videoPrompt: string;
  explanation: string;
  data?: GenerateConceptVideoSceneOutput;
  status: 'pending' | 'loading' | 'done' | 'error';
  errorMessage?: string;
};

export function VideoGenerator() {
  const [analysis, setAnalysis] = useState<ConceptAnalysis | null>(null);
  const [scenes, setScenes] = useState<SceneState[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { concept: "", subject: "", language: "English" },
  });

  useEffect(() => {
    if (analysis && isGenerating) {
        generateAllScenes();
    }
  }, [analysis, isGenerating]);


  async function onSubmit(data: FormValues) {
    setIsAnalyzing(true);
    setAnalysis(null);
    setScenes([]);
    setIsGenerating(false);
    try {
      const analysisResult = await analyzeConceptForVideo(data);
      setAnalysis(analysisResult);
      setScenes(analysisResult.scenes.map(s => ({
        sceneTitle: s.sceneTitle,
        videoPrompt: s.videoPrompt,
        explanation: s.explanation,
        status: 'pending',
      })));
      setIsGenerating(true); // Trigger asset generation
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Analyzing Concept",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function generateAllScenes() {
    if (!analysis) return;

    for (let i = 0; i < analysis.scenes.length; i++) {
      setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'loading' } : s));
      try {
        const sceneResult = await generateConceptVideoScene({
          videoPrompt: analysis.scenes[i].videoPrompt,
        });
        setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'done', data: sceneResult } : s));
      } catch (error) {
        console.error(`Error generating scene ${i + 1}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'error', errorMessage } : s));
        toast({ title: `Error in Scene ${i + 1}`, description: errorMessage, variant: "destructive" });
      }
    }
    setIsGenerating(false);
  }
  
  const loadingMessage = isAnalyzing 
    ? "Analyzing Concept..." 
    : isGenerating 
      ? "Generating Video Scenes..."
      : "Generate Multi-Step Video";

  return (
    <>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="concept"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complex Concept to Explain</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., The water cycle, cellular respiration, supply and demand..." {...field} rows={3} disabled={isAnalyzing || isGenerating} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Grade Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isAnalyzing || isGenerating}>
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
                        <Input placeholder="e.g., Biology, History" {...field} disabled={isAnalyzing || isGenerating} />
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
                      <Input placeholder="e.g., Spanish, French, Japanese" {...field} disabled={isAnalyzing || isGenerating} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <Button type="submit" disabled={isAnalyzing || isGenerating} className="w-full md:w-auto">
              {isAnalyzing || isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loadingMessage}
            </Button>
          </form>
        </Form>
      </CardContent>

      {analysis && (
        <CardFooter className="flex-col items-start space-y-4 w-full">
            <h3 className="text-2xl font-bold text-center w-full">{analysis.title}</h3>
            
            <Carousel opts={{ align: "start", loop: false }} className="w-full max-w-3xl mx-auto">
                <CarouselContent>
                {scenes.map((scene, index) => (
                    <CarouselItem key={index}>
                    <div className="p-1 h-full">
                        <div className="flex flex-col h-full p-4 border rounded-lg bg-muted gap-4">
                            <p className="text-lg text-center font-semibold text-foreground leading-relaxed">
                                {index + 1}. {scene.sceneTitle}
                            </p>
                            <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black/80 flex items-center justify-center">
                                {scene.status === 'done' && scene.data?.videoUrl ? (
                                    <video src={scene.data.videoUrl} className="w-full h-full object-contain" loop autoPlay muted>
                                        Your browser does not support the video tag.
                                    </video>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                                        {scene.status === 'loading' && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                                        {scene.status === 'error' && <p className="text-destructive-foreground text-sm">⚠️<br />{scene.errorMessage}</p>}
                                        {scene.status === 'pending' && <p className="text-muted-foreground">Waiting...</p>}
                                    </div>
                                )}
                            </div>
                             <p className="text-sm text-foreground leading-relaxed h-24 overflow-y-auto p-2 bg-background rounded-md">
                                {scene.explanation}
                            </p>
                        </div>
                    </div>
                    </CarouselItem>
                ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
             <div className="text-center text-sm text-muted-foreground w-full">
                <p>Navigate through the video steps using the arrows.</p>
            </div>
        </CardFooter>
      )}
    </>
  );
}
