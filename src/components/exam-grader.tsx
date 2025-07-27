
"use client";

import { gradeExamPaper, ExamGraderOutput } from "@/ai/flows/exam-grader";
import { saveGradingResult } from "@/services/student-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Camera, Upload, Save, ScanLine } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Skeleton } from "./ui/skeleton";
import ReactMarkdown from 'react-markdown';
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  className: z.string().min(2, "Class name is required."),
  examTopic: z.string().min(5, "Exam topic is required."),
  subject: z.string().min(2, "Subject is required."),
  totalMarks: z.coerce.number().int().min(1, "Total marks must be at least 1."),
  answerKey: z.string().min(10, "The answer key is required."),
  examImage: z.string({ required_error: "An image of the exam paper is required." }),
});

type FormValues = z.infer<typeof formSchema>;

export function ExamGrader() {
  const [result, setResult] = useState<ExamGraderOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { className: "", examTopic: "", subject: "", totalMarks: 100, answerKey: "" },
  });
  
  useEffect(() => {
    return () => {
      // Cleanup: stop camera stream when component unmounts
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        form.setValue("examImage", dataUrl);
        setPreviewImage(dataUrl);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }});
        setHasCameraPermission(true);
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
    } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description: "Please enable camera permissions to use this feature.",
        });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        form.setValue("examImage", dataUrl);
        setPreviewImage(dataUrl);
      }
      stopCamera();
    }
  };

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const output = await gradeExamPaper(data);
      setResult(output);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Grading Exam",
        description: "The AI agent failed to grade the paper. Please check the image and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setIsSaving(true);
    try {
      await saveGradingResult({
          studentName: result.studentName,
          className: form.getValues("className"),
          subject: form.getValues("subject"),
          examTopic: form.getValues("examTopic"),
          score: result.score,
          totalMarks: result.totalMarks,
          feedback: result.feedback,
      });
      toast({
        title: "Success!",
        description: `Grading result for ${result.studentName} has been saved.`,
      });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to save the grading result.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="className" render={({ field }) => ( <FormItem><FormLabel>Class</FormLabel><FormControl><Input placeholder="e.g., Grade 5" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="subject" render={({ field }) => ( <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g., Mathematics" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="examTopic" render={({ field }) => ( <FormItem><FormLabel>Exam Topic</FormLabel><FormControl><Input placeholder="e.g., Algebra II Final" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="totalMarks" render={({ field }) => ( <FormItem><FormLabel>Total Marks</FormLabel><FormControl><Input type="number" placeholder="e.g., 100" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>

            <FormField control={form.control} name="answerKey" render={({ field }) => (
                <FormItem>
                    <FormLabel>Answer Key</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Paste the exam questions and correct answers here..." {...field} rows={6} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="examImage" render={({ field }) => (
                <FormItem>
                    <FormLabel>Exam Paper Image</FormLabel>
                    <div className="flex flex-col gap-4 items-center justify-center p-4 border-2 border-dashed rounded-lg">
                        {previewImage ? (
                            <Image src={previewImage} alt="Exam Preview" width={300} height={400} className="rounded-md object-contain max-h-64" />
                        ) : isCameraOn ? (
                             <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <ScanLine className="mx-auto h-12 w-12" />
                                <p>Upload or capture an image of the exam paper.</p>
                            </div>
                        )}
                        <div className="flex gap-4">
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}> <Upload className="mr-2" /> Upload</Button>
                            <Button type="button" variant="outline" onClick={isCameraOn ? captureImage : startCamera}> <Camera className="mr-2" /> {isCameraOn ? 'Capture' : 'Use Camera'} </Button>
                        </div>
                    </div>
                    {hasCameraPermission === false && (
                        <Alert variant="destructive">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>Please allow camera access in your browser settings to use this feature.</AlertDescription>
                        </Alert>
                    )}
                    <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    <FormMessage />
                </FormItem>
            )} />

            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Grade Exam Paper
            </Button>
          </form>
        </Form>
      </CardContent>

      {(isLoading || result) && (
        <CardFooter className="flex-col items-start w-full gap-4">
            {isLoading ? (
                <div className="w-full p-4 border rounded-lg bg-muted space-y-4">
                    <Skeleton className="w-1/4 h-8" />
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-4/5 h-4" />
                    <Skeleton className="w-1/2 h-4" />
                </div>
            ) : result && (
                <div className="w-full">
                    <Card className="bg-muted/50">
                        <CardContent className="p-6">
                            <h3 className="text-2xl font-bold">{result.studentName}</h3>
                            <p className="text-muted-foreground">{form.getValues("subject")} - {form.getValues("examTopic")}</p>
                            <div className="my-4">
                                <p className="text-4xl font-bold text-primary">{result.score}<span className="text-xl text-muted-foreground"> / {result.totalMarks}</span></p>
                            </div>
                            <h4 className="font-semibold text-lg mb-2">Feedback & Analysis</h4>
                            <div className="prose prose-sm max-w-none prose-p:text-foreground">
                                <ReactMarkdown>{result.feedback}</ReactMarkdown>
                            </div>
                        </CardContent>
                    </Card>
                     <Button onClick={handleSave} disabled={isSaving} className="mt-4">
                        {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                        Save Result
                    </Button>
                </div>
            )}
        </CardFooter>
      )}
    </>
  );
}
