

"use client";

import { getStudents, Student, addStudent } from "@/services/student-service";
import { evaluateStudentPerformance } from "@/ai/flows/student-evaluator";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Activity, Award, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus, AlertCircle, CalendarDays, BookCheck, MessageSquare, Briefcase, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList, Line, LineChart, Pie, PieChart, Cell } from "recharts";
import { ChartConfig } from "./ui/chart";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";


const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  className: z.string().min(1, { message: "Class name is required." }),
  accommodations: z.string().optional(),
  lastPositiveNote: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function StudentDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<{ evaluationSummary: string } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", className: "", accommodations: "", lastPositiveNote: "" },
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setIsLoading(true);
    try {
      const studentList = await getStudents();
      setStudents(studentList);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not fetch students.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(data: FormValues) {
    setIsAdding(true);
    try {
      const accommodationList = data.accommodations ? data.accommodations.split(',').map(s => s.trim()) : [];
      await addStudent(data.name, data.className, accommodationList, data.lastPositiveNote);
      toast({ title: "Success", description: "Student added successfully." });
      form.reset();
      setIsAddStudentDialogOpen(false);
      fetchStudents();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to add student.", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  }

  async function handleEvaluate(student: Student) {
    setSelectedStudent(student);
    setIsEvaluating(student.id);
    setIsEvaluationDialogOpen(true);
    setEvaluation(null);
    try {
      const result = await evaluateStudentPerformance({ studentId: student.id, studentName: student.name });
      setEvaluation(result);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to evaluate student performance.", variant: "destructive" });
    } finally {
      setIsEvaluating(null);
    }
  }
  
  const chartData = students.map(s => ({
    name: s.name.split(' ')[0], // Use first name for chart
    averageScore: s.averageScore,
    fill: s.averageScore >= 85 ? 'hsl(var(--chart-2))' : s.averageScore >= 70 ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-1))',
  }));

  const chartConfig = {
    averageScore: {
      label: "Average Score",
    },
  } satisfies ChartConfig;

  const submissionChartConfig = {
    submissions: {
      label: "Submissions",
    },
    onTime: {
      label: "On Time",
      color: "hsl(var(--chart-2))",
    },
    late: {
      label: "Late",
      color: "hsl(var(--chart-4))",
    },
    missing: {
      label: "Missing",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

   const getStatusBadgeVariant = (status: Student['status']) => {
    switch (status) {
        case 'Excelling': return "default";
        case 'On Track': return "secondary";
        case 'Needs Attention': return "destructive";
    }
  }

   const getStatusIcon = (status: Student['status']) => {
    switch (status) {
      case 'Excelling':
        return <Award className="h-4 w-4 text-green-500" />;
      case 'On Track':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'Needs Attention':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const TrendArrow = ({ trend }: { trend: Student['trend'] }) => {
    if (trend === 'up') return <ArrowUp className="h-5 w-5 text-green-500" />;
    if (trend === 'down') return <ArrowDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  }

  const HistoryEventIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'Parent Communication': return <Mail className="h-5 w-5 text-blue-500" />;
        case 'Student Conference': return <MessageSquare className="h-5 w-5 text-green-500" />;
        case 'System Alert': return <AlertCircle className="h-5 w-5 text-red-500" />;
        case 'Counselor Note': return <Briefcase className="h-5 w-5 text-purple-500" />;
        default: return <BookCheck className="h-5 w-5 text-muted-foreground" />;
    }
  }

  return (
    <div className="space-y-8">

      <Card>
        <CardHeader>
          <CardTitle>Class Performance Overview</CardTitle>
          <CardDescription>Average scores across all completed quizzes.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <BarChart accessibilityLayer data={chartData} margin={{ top: 20, left: -20, right: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="averageScore" radius={8}>
                   {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                    formatter={(value: number) => `${value}%`}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Student Roster</h2>
            <p className="text-muted-foreground">View and evaluate your students.</p>
          </div>
          <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2" />
                Add New Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="className"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Grade 5 Math" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accommodations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accommodations</FormLabel>
                        <FormControl>
                          <Textarea placeholder="List accommodations, separated by commas..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastPositiveNote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Positive Note</FormLabel>
                        <FormControl>
                           <Input placeholder="e.g., Eager to participate!" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={isAdding}>
                      {isAdding && <Loader2 className="mr-2 animate-spin" />}
                      Add Student
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {students.map((student) => (
                    <Card key={student.id} className="flex flex-col text-center hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="flex-grow flex flex-col items-center p-6">
                           <Avatar className="h-24 w-24 mb-4 border-4 border-muted">
                             <AvatarImage src={student.avatar} alt={student.name} data-ai-hint="student person" />
                             <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <h3 className="text-xl font-bold">{student.name}</h3>
                           <p className="text-sm text-muted-foreground">{student.className}</p>
                           <Badge variant={getStatusBadgeVariant(student.status)} className="mt-2 capitalize">
                               {student.status}
                           </Badge>
                           <Separator className="my-4"/>
                           <div className="w-full grid grid-cols-3 gap-2 text-sm">
                                <div className="text-center">
                                    <p className="font-semibold text-lg">{student.averageScore > 0 ? `${student.averageScore}%` : 'N/A'}</p>
                                    <p className="text-muted-foreground text-xs">Avg. Score</p>
                                </div>
                                 <div className="text-center">
                                    <p className="font-semibold text-lg">{student.quizzesCompleted}</p>
                                    <p className="text-muted-foreground text-xs">Quizzes</p>
                                </div>
                                 <div className="text-center">
                                    <p className="font-semibold text-lg">{student.lastActivityDate.split('/')[0]}/{student.lastActivityDate.split('/')[1]}</p>
                                    <p className="text-muted-foreground text-xs">Last Activity</p>
                                </div>
                           </div>
                        </CardContent>
                        <CardFooter className="p-4">
                            <Button 
                                variant="outline"
                                className="w-full"
                                onClick={() => handleEvaluate(student)}
                                disabled={isEvaluating === student.id}
                            >
                                {isEvaluating === student.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Activity className="mr-2" />
                                )}
                                Evaluate
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
          )}
      </div>

       <Dialog open={isEvaluationDialogOpen} onOpenChange={setIsEvaluationDialogOpen}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            {selectedStudent ? (
                <>
                <DialogHeader className="pr-10">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-20 w-20 border-2 border-primary">
                            <AvatarImage src={selectedStudent.avatar} alt={selectedStudent.name} />
                            <AvatarFallback>{selectedStudent.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <DialogTitle className="text-3xl">{selectedStudent.name}</DialogTitle>
                            <div className="flex items-center gap-4 text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-foreground">{selectedStudent.averageScore}%</span>
                                    <TrendArrow trend={selectedStudent.trend} />
                                </div>
                                <Separator orientation="vertical" className="h-6"/>
                                <div>
                                    <span className="font-semibold">{getStatusIcon(selectedStudent.status)} {selectedStudent.status}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-right">
                           <p className="font-semibold">Critical Alerts:</p>
                           <div className="flex flex-col items-end gap-1">
                                {selectedStudent.alerts.missingAssignments > 0 && <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle size={14} />{selectedStudent.alerts.missingAssignments} Missing Assignments</Badge>}
                                {selectedStudent.alerts.attendanceConcern && <Badge variant="destructive" className="flex items-center gap-1"><CalendarDays size={14} />Attendance Concern</Badge>}
                                {selectedStudent.alerts.behavioralNote && <Badge variant="secondary" className="flex items-center gap-1"><BookCheck size={14} />Recent Behavioral Note</Badge>}
                           </div>
                        </div>
                    </div>
                    <Separator className="my-4" />
                     <div className="grid grid-cols-2 gap-4 text-left text-sm">
                        <div>
                            <p className="font-semibold text-foreground">Accommodations</p>
                            {selectedStudent.accommodations?.length > 0 ? (
                                <ul className="list-disc pl-5 text-muted-foreground">
                                    {selectedStudent.accommodations.map(acc => <li key={acc}>{acc}</li>)}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground">None</p>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">Last Positive Note</p>
                            <p className="text-muted-foreground italic">&quot;{selectedStudent.lastPositiveNote}&quot;</p>
                        </div>
                    </div>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto -mx-6 px-6">
                    <Tabs defaultValue="academics" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="academics">Tier 1: Academics</TabsTrigger>
                            <TabsTrigger value="behaviors">Tier 2: Behaviors</TabsTrigger>
                            <TabsTrigger value="history">Tier 3: History</TabsTrigger>
                        </TabsList>
                        <TabsContent value="academics" className="pt-4">
                            <h3 className="font-semibold mb-2">AI-Generated Performance Analysis</h3>
                            {isEvaluating === selectedStudent.id ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader2 className="animate-spin text-primary h-8 w-8" />
                                </div>
                            ) : evaluation ? (
                                <div className="prose dark:prose-invert max-w-none text-sm">
                                    <ReactMarkdown>{evaluation.evaluationSummary}</ReactMarkdown>
                                </div>
                            ) : (
                                <p>No evaluation available. Click evaluate to start.</p>
                            )}
                             <Separator className="my-6" />
                             <h3 className="font-semibold mb-4">Assessment Trend</h3>
                             <div className="h-64 w-full">
                                <ChartContainer config={{score: {label: "Score", color: "hsl(var(--primary))"}}} className="h-full w-full">
                                    <LineChart data={selectedStudent.assessmentHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={8} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{fill: "hsl(var(--primary))"}} activeDot={{r: 6}} />
                                    </LineChart>
                                </ChartContainer>
                             </div>
                        </TabsContent>
                        <TabsContent value="behaviors" className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div>
                                <h3 className="font-semibold mb-4">Submission Patterns</h3>
                                <ChartContainer config={submissionChartConfig} className="min-h-[200px] w-full">
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                        <Pie data={selectedStudent.submissionPatterns} dataKey="value" nameKey="name" innerRadius={50} />
                                    </PieChart>
                                </ChartContainer>
                           </div>
                           <div>
                                <h3 className="font-semibold mb-4">In-Class Observations</h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                    {selectedStudent.behavioralObservations.map((obs, i) => (
                                        <Card key={i} className="bg-muted/50">
                                            <CardContent className="p-3">
                                                <p className="text-sm">{obs.note}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {obs.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2 text-right">{obs.date}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                           </div>
                        </TabsContent>
                        <TabsContent value="history" className="pt-4">
                            <h3 className="font-semibold mb-4">Communication & History Log</h3>
                            <div className="relative pl-6">
                                <div className="absolute left-6 top-0 h-full w-0.5 bg-border -translate-x-1/2"></div>
                                {selectedStudent.communicationHistory.map((event, i) => (
                                    <div key={i} className="relative flex items-start gap-4 mb-6">
                                        <div className="absolute left-0 top-0 h-full flex items-center">
                                            <div className="z-10 bg-background p-1 rounded-full border-2 border-background">
                                                <HistoryEventIcon type={event.type} />
                                            </div>
                                        </div>
                                        <div className="pl-6 w-full">
                                            <p className="text-xs text-muted-foreground">{event.date}</p>
                                            <p className="font-semibold">{event.type}</p>
                                            <p className="text-sm text-muted-foreground">{event.summary}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                </>
            ) : (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="animate-spin text-primary h-12 w-12" />
                </div>
            )}
          </DialogContent>
       </Dialog>
    </div>
  );
}
