
"use client";
import { generateQuiz, GenerateQuizOutput, QuizQuestion } from "@/ai/flows/student-quiz-generator";
import { evaluateStudentAnswers } from "@/ai/flows/student-performance-evaluator";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, FileImage, Loader2, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { OutputActions } from "./output-actions";
import { Input } from "./ui/input";
import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "./ui/skeleton";

const formSchema = z.object({
  topic: z.string().min(10, { message: "Topic must be at least 10 characters." }),
  gradeLevel: z.string({ required_error: "Please select a grade level." }),
  numberOfQuestions: z.coerce.number().int().min(1).max(10).default(5),
  language: z.string().min(2, { message: "Language is required."}),
  image: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type AssessorState = 'idle' | 'generating' | 'taking' | 'evaluating' | 'report';

export function StudentAssessor() {
  const [state, setState] = useState<AssessorState>('idle');
  const [quiz, setQuiz] = useState<GenerateQuizOutput | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [report, setReport] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: "", numberOfQuestions: 5, language: "English" },
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

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const allQuestionsAnswered = quiz ? Object.keys(userAnswers).length === quiz.questions.length : false;

  async function handleGenerateQuiz(data: FormValues) {
    setState('generating');
    setQuiz(null);
    setReport(null);
    setUserAnswers({});
    try {
      const output = await generateQuiz(data);
      setQuiz(output);
      setState('taking');
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Generating Quiz",
        description: "Failed to generate the quiz. The AI might have returned an invalid format. Please try again.",
        variant: "destructive",
      });
      setState('idle');
    }
  }

  async function handleAnalyzeAnswers() {
    if (!quiz) return;
    setState('evaluating');
    setIsSubmitting(true);
    try {
        const { report: analysisReport } = await evaluateStudentAnswers({
            quizQuestions: quiz.questions,
            studentAnswers: quiz.questions.map((q, i) => userAnswers[i] || "Not Answered"),
        });
        setReport(analysisReport);
        setState('report');
    } catch (error) {
        console.error("Error analyzing answers:", error);
        toast({ title: "Error", description: "Failed to analyze the quiz answers.", variant: "destructive" });
        setState('taking'); // Go back to the quiz
    } finally {
        setIsSubmitting(false);
    }
  }

  const isLoading = state === 'generating' || state === 'evaluating';

  return (
    <>
      <CardContent>
        {state !== 'taking' && state !== 'report' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGenerateQuiz)} className="space-y-6">
              <FormField control={form.control} name="topic" render={({ field }) => ( <FormItem> <FormLabel>Quiz Topic</FormLabel> <FormControl> <Textarea placeholder="e.g., The Solar System, World War II causes..." {...field} rows={3} disabled={isLoading} /> </FormControl> <FormMessage /> </FormItem> )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="gradeLevel" render={({ field }) => ( <FormItem> <FormLabel>Grade Level</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}> <FormControl> <SelectTrigger> <SelectValue placeholder="Select a grade" /> </SelectTrigger> </FormControl> <SelectContent> {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => ( <SelectItem key={grade} value={`Grade ${grade}`}>Grade {grade}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                 <FormField
                  control={form.control}
                  name="numberOfQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Questions</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of questions" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[...Array(10)].map((_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField control={form.control} name="language" render={({ field }) => ( <FormItem> <FormLabel>Language</FormLabel> <FormControl> <Input placeholder="e.g., Spanish, French, Japanese" {...field} disabled={isLoading} /> </FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={form.control} name="image" render={() => ( <FormItem> <FormLabel>Optional Image</FormLabel> <FormControl> <div className="flex items-center gap-4"> <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}> <FileImage className="mr-2" /> Upload Image </Button> <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} /> {previewImage && <Image src={previewImage} alt="Preview" width={48} height={48} className="rounded-md object-cover" />} </div> </FormControl> <FormMessage /> </FormItem> )} />
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Quiz
              </Button>
            </form>
          </Form>
        )}
      </CardContent>

      <CardFooter className="flex-col items-start gap-4">
        {state === 'generating' && (
            <div className="w-full space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        )}

        {quiz && (state === 'taking' || state === 'evaluating' || state === 'report') && (
          <div className="w-full">
            <h3 className="text-2xl font-bold mb-4 text-center">Quiz on {form.getValues("topic")}</h3>
            <div className="space-y-6">
                {quiz.questions.map((q, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${state === 'report' ? (userAnswers[index] === q.answer ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') : 'bg-muted/50'}`}>
                        <p className="font-semibold mb-3">{index + 1}. {q.question}</p>
                        <RadioGroup onValueChange={(value) => handleAnswerChange(index, value)} value={userAnswers[index]} disabled={state !== 'taking'}>
                            {q.options.map((option, i) => (
                                <FormItem key={i} className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <RadioGroupItem value={option} />
                                    </FormControl>
                                    <FormLabel className="font-normal flex items-center gap-2">
                                        {option}
                                        {state === 'report' && option === q.answer && <CheckCircle className="h-5 w-5 text-green-600" />}
                                        {state === 'report' && userAnswers[index] === option && option !== q.answer && <XCircle className="h-5 w-5 text-red-600" />}
                                    </FormLabel>
                                </FormItem>
                            ))}
                        </RadioGroup>
                    </div>
                ))}
            </div>
            {state === 'taking' && (
                <Button onClick={handleAnalyzeAnswers} disabled={!allQuestionsAnswered || isSubmitting} className="mt-6 w-full md:w-auto">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit Quiz for Analysis
                </Button>
            )}
          </div>
        )}
        
        {state === 'evaluating' && (
             <div className="w-full pt-6 border-t mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing your answers...
                </h3>
                <div className="space-y-4">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </div>
        )}

        {state === 'report' && report && (
             <div className="w-full pt-6 border-t mt-6">
                <h3 className="text-2xl font-bold mb-4">Performance Report</h3>
                <div className="prose dark:prose-invert max-w-none p-4 border rounded-lg bg-muted">
                    <ReactMarkdown>{report}</ReactMarkdown>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <OutputActions content={report} title={`Quiz Report on ${form.getValues("topic")}`} />
                    <Button variant="outline" onClick={() => setState('idle')}>Start a New Quiz</Button>
                </div>
            </div>
        )}
      </CardFooter>
    </>
  );
}
