
"use client";

import { analyzeStory, StoryAnalysis } from "@/ai/flows/story-analyzer";
import { generateScene, SceneOutput, generateCharacterSheet, generateConceptImage } from "@/ai/flows/scene-generator";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Skeleton } from "./ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import React from "react";
import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

const formSchema = z.object({
  story: z.string().min(20, { message: "Story must be at least 20 characters." }),
  grade: z.string({ required_error: "Please select a grade level." }),
});

type FormValues = z.infer<typeof formSchema>;

type SceneState = {
  narrationText: string;
  illustrationPrompt: string;
  data?: SceneOutput;
  status: 'pending' | 'loading' | 'done' | 'error';
  errorMessage?: string;
};

type KeyConceptState = {
  concept: string;
  explanation: string;
  visualPrompt: string;
  imageUrl?: string;
  status: 'pending' | 'loading' | 'done' | 'error';
};

export function AnimatedStorybook() {
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null);
  const [scenes, setScenes] = useState<SceneState[]>([]);
  const [keyConcepts, setKeyConcepts] = useState<KeyConceptState[]>([]);
  const [characterSheetUri, setCharacterSheetUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>();
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { story: "" },
  });

  useEffect(() => {
    if (!carouselApi || !audioRefs.current.length) return;

    const onSelect = (api: CarouselApi) => {
      const selectedIndex = api.selectedScrollSnap();
      audioRefs.current.forEach((audio, index) => {
        if (audio && index !== selectedIndex) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      // Don't auto-play on select, let the user control it.
    };

    carouselApi.on("select", onSelect);
    carouselApi.on("reInit", onSelect);

    return () => {
        carouselApi.off("select", onSelect);
        carouselApi.off("reInit", onSelect);
    };
  }, [carouselApi]);


  useEffect(() => {
    if (analysis && isGenerating) {
        generateAssets();
    }
  }, [analysis, isGenerating]);


  async function onSubmit(data: FormValues) {
    setIsAnalyzing(true);
    setAnalysis(null);
    setScenes([]);
    setKeyConcepts([]);
    setCharacterSheetUri(null);
    setIsGenerating(false);
    try {
      const analysisResult = await analyzeStory(data);
      setAnalysis(analysisResult);
      setScenes(analysisResult.scenes.map(s => ({
        narrationText: s.narrationText,
        illustrationPrompt: s.illustrationPrompt,
        status: 'pending',
      })));
      setKeyConcepts(analysisResult.keyConcepts.map(kc => ({
        ...kc,
        status: 'pending',
      })));
      setIsGenerating(true); // Trigger asset generation
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Analyzing Story",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function generateAssets() {
    if (!analysis) return;

    // Generate Character Sheet first
    try {
      const sheet = await generateCharacterSheet({ characterSheetPrompt: analysis.characterSheetPrompt });
      setCharacterSheetUri(sheet.characterSheetDataUri);
    } catch (error) {
      console.error("Failed to generate character sheet", error);
      toast({ title: "Warning", description: "Could not generate a character sheet. Character consistency may be affected.", variant: "destructive" });
    }

    // Trigger scene and concept generation to run in parallel
    const scenePromises = generateAllScenes(analysis.scenes);
    const conceptPromises = generateAllConcepts(analysis.keyConcepts);

    await Promise.all([scenePromises, conceptPromises]);
    
    setIsGenerating(false);
  }

  async function generateAllScenes(sceneData: StoryAnalysis['scenes']) {
    for (let i = 0; i < sceneData.length; i++) {
      setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'loading' } : s));
      try {
        const sceneResult = await generateScene({
          narrationText: sceneData[i].narrationText,
          illustrationPrompt: sceneData[i].illustrationPrompt,
          characterSheetDataUri: characterSheetUri ?? undefined,
        });
        setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'done', data: sceneResult } : s));
      } catch (error) {
        console.error(`Error generating scene ${i + 1}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'error', errorMessage } : s));
        toast({ title: `Error in Scene ${i + 1}`, description: errorMessage, variant: "destructive" });
      }
    }
  }

  async function generateAllConcepts(conceptData: StoryAnalysis['keyConcepts']) {
      for (let i = 0; i < conceptData.length; i++) {
          setKeyConcepts(prev => prev.map((kc, idx) => idx === i ? { ...kc, status: 'loading' } : kc));
          try {
              const { imageUrl } = await generateConceptImage({ prompt: conceptData[i].visualPrompt });
              if (!imageUrl) throw new Error("Image generation returned no media.");
              setKeyConcepts(prev => prev.map((kc, idx) => idx === i ? { ...kc, status: 'done', imageUrl } : kc));
          } catch (error) {
              console.error(`Error generating concept image ${i + 1}:`, error);
              setKeyConcepts(prev => prev.map((kc, idx) => idx === i ? { ...kc, status: 'error' } : kc));
              toast({ title: `Error generating image for concept "${conceptData[i].concept}"`, variant: "destructive" });
          }
      }
  }

  function handlePlayAudio(index: number) {
    const audio = audioRefs.current[index];
    if (audio) {
      audioRefs.current.forEach((a, i) => {
        if (a && i !== index) {
            a.pause();
            a.currentTime = 0;
        }
      });
      if (audio.paused) {
        audio.play().catch(e => console.log("Play failed", e));
      } else {
        audio.pause();
      }
    }
  }
  
  const loadingMessage = isAnalyzing 
    ? "Analyzing Story..." 
    : isGenerating 
      ? "Generating Assets..."
      : "Create Animated Storybook";

  return (
    <>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="story"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story or Poem</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Paste your story here..." {...field} rows={6} disabled={isAnalyzing || isGenerating} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <Button type="submit" disabled={isAnalyzing || isGenerating} className="w-full md:w-auto">
              {(isAnalyzing || isGenerating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loadingMessage}
            </Button>
          </form>
        </Form>
      </CardContent>

      {(analysis) && (
        <CardFooter className="flex-col items-start space-y-4 w-full">
            <h3 className="text-2xl font-bold text-center w-full">{analysis.title}</h3>
            {characterSheetUri &&
                <div className="w-full flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">Generated Character Reference</p>
                    <Image src={characterSheetUri} alt="Character Sheet" width={100} height={100} className="rounded-lg border bg-muted" />
                </div>
            }
            <Carousel setApi={setCarouselApi} opts={{ align: "start", loop: false }} className="w-full max-w-3xl mx-auto">
                <CarouselContent>
                {scenes.map((scene, index) => (
                    <CarouselItem key={index}>
                    <div className="p-1 h-full">
                        <div className="flex flex-col h-full p-4 border rounded-lg bg-muted gap-4">
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
                            <p className="text-base text-center font-medium text-foreground leading-relaxed h-20 overflow-y-auto p-2">
                                {scene.narrationText}
                            </p>
                            {scene.status === 'done' && scene.data?.narrationAudio && (
                                <>
                                <audio ref={el => audioRefs.current[index] = el} src={scene.data.narrationAudio} />
                                <Button onClick={() => handlePlayAudio(index)} variant="outline" size="sm" className="mx-auto">
                                    Play Narration
                                </Button>
                                </>
                            )}
                        </div>
                    </div>
                    </CarouselItem>
                ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
             <div className="text-center text-sm text-muted-foreground w-full">
                <p>Navigate through the scenes using the arrows.</p>
            </div>

            {keyConcepts.length > 0 && (
                <div className="w-full max-w-3xl mx-auto pt-6">
                    <h4 className="text-xl font-bold mb-4">Key Concepts</h4>
                    <Accordion type="single" collapsible className="w-full">
                        {keyConcepts.map((kc, index) => (
                            <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger>{kc.concept}</AccordionTrigger>
                                <AccordionContent>
                                    <div className="flex flex-col md:flex-row gap-4 items-start">
                                        <div className="flex-1 space-y-2">
                                            <p className="font-semibold">Explanation:</p>
                                            <p>{kc.explanation}</p>
                                        </div>
                                        <div className="w-full md:w-48 h-48 relative flex-shrink-0 bg-muted rounded-md flex items-center justify-center">
                                            {kc.status === 'loading' && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                                            {kc.status === 'done' && kc.imageUrl && <Image src={kc.imageUrl} alt={`Visual for ${kc.concept}`} fill objectFit="cover" className="rounded-md" />}
                                            {kc.status === 'error' && <p className="text-destructive text-xs text-center p-2">Image failed to generate.</p>}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            )}
        </CardFooter>
      )}
    </>
  );
}
