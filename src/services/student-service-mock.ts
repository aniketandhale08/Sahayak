

"use server";

// This is a mock service that simulates fetching and saving student data.
// It is used to bypass the need for a fully configured Firestore database in this prototype.

import { Timestamp } from 'firebase/firestore';

export interface Student {
    id: string;
    name: string;
    className: string;
    createdAt: string; 
    quizzesCompleted: number;
    averageScore: number;
    status: 'On Track' | 'Needs Attention' | 'Excelling';
    lastActivityDate: string;
    avatar: string;
    trend: 'up' | 'down' | 'stable';
    alerts: {
        missingAssignments: number;
        attendanceConcern: boolean;
        behavioralNote: boolean;
    };
    accommodations: string[];
    lastPositiveNote: string;
    assessmentHistory: { name: string; score: number }[];
    submissionPatterns: { name: string; value: number; fill: string }[];
    behavioralObservations: { date: string; note: string; tags: string[] }[];
    communicationHistory: { date: string; type: string; summary: string }[];
}

export interface QuizResult {
    id: string;
    studentId: string;
    quizName: string;
    quizData: any;
    savedAt: Timestamp;
}

// Predefined list of mock students with richer data
const mockStudentsData: Omit<Student, 'quizzesCompleted' | 'averageScore' | 'status' | 'lastActivityDate'>[] = [
    { 
        id: '1', name: 'Alice Johnson', className: 'Grade 5 Math', createdAt: new Date().toISOString(), 
        avatar: 'https://placehold.co/100x100.png', trend: 'up', 
        alerts: { missingAssignments: 0, attendanceConcern: false, behavioralNote: false }, 
        accommodations: ['Extra time on tests'], lastPositiveNote: 'Led her group effectively on 10/26.', 
        assessmentHistory: [{ name: 'Q1', score: 85 }, { name: 'Q2', score: 88 }, { name: 'Q3', score: 92 }],
        submissionPatterns: [ { name: 'On Time', value: 18, fill: 'hsl(var(--chart-2))' }, { name: 'Late', value: 2, fill: 'hsl(var(--chart-4))' }, { name: 'Missing', value: 0, fill: 'hsl(var(--chart-1))' } ],
        behavioralObservations: [ { date: '10/28/2024', note: 'Actively participated in the group discussion and helped a peer.', tags: ['#CollaboratesWell', '#HelpsPeers'] }, { date: '10/22/2024', note: 'Asked a very insightful question about fractions.', tags: ['#AsksInsightfulQuestions'] } ],
        communicationHistory: [ { date: '10/15/2024', type: 'Parent Communication', summary: 'Emailed Mom re: upcoming field trip.' } ]
    },
    { 
        id: '2', name: 'Bob Williams', className: 'Grade 5 Math', createdAt: new Date().toISOString(), 
        avatar: 'https://placehold.co/100x100.png', trend: 'down', 
        alerts: { missingAssignments: 3, attendanceConcern: true, behavioralNote: false }, 
        accommodations: ['Preferential seating'], lastPositiveNote: 'Showed great improvement in participation.', 
        assessmentHistory: [{ name: 'Q1', score: 75 }, { name: 'Q2', score: 68 }, { name: 'Q3', score: 62 }],
        submissionPatterns: [ { name: 'On Time', value: 12, fill: 'hsl(var(--chart-2))' }, { name: 'Late', value: 5, fill: 'hsl(var(--chart-4))' }, { name: 'Missing', value: 3, fill: 'hsl(var(--chart-1))' } ],
        behavioralObservations: [ { date: '10/25/2024', note: 'Was distracted during the lesson, needed several reminders to get on task.', tags: ['#NeedsRedirection'] } ],
        communicationHistory: [ { date: '10/26/2024', type: 'System Alert', summary: 'Grade dropped >10%.' }, { date: '10/20/2024', type: 'Student Conference', summary: 'Met with student about missing assignments.' } ]
    },
    { 
        id: '3', name: 'Charlie Brown', className: 'Grade 6 Science', createdAt: new Date().toISOString(), 
        avatar: 'https://placehold.co/100x100.png', trend: 'stable', 
        alerts: { missingAssignments: 1, attendanceConcern: false, behavioralNote: true }, 
        accommodations: [], lastPositiveNote: 'Asked a very insightful question about photosynthesis.', 
        assessmentHistory: [{ name: 'Q1', score: 78 }, { name: 'Q2', score: 80 }, { name: 'Q3', score: 79 }],
        submissionPatterns: [ { name: 'On Time', value: 15, fill: 'hsl(var(--chart-2))' }, { name: 'Late', value: 4, fill: 'hsl(var(--chart-4))' }, { name: 'Missing', value: 1, fill: 'hsl(var(--chart-1))' } ],
        behavioralObservations: [ { date: '10/29/2024', note: 'Showed frustration when working on a difficult problem but did not give up.', tags: ['#ShowsResilience'] } ],
        communicationHistory: [ { date: '10/28/2024', type: 'Counselor Note', summary: 'Counselor met with student, notes on file.' } ]
    },
    { 
        id: '4', name: 'Diana Prince', className: 'Grade 6 Science', createdAt: new Date().toISOString(), 
        avatar: 'https://placehold.co/100x100.png', trend: 'up', 
        alerts: { missingAssignments: 0, attendanceConcern: false, behavioralNote: false }, 
        accommodations: ['Access to a copy of notes'], lastPositiveNote: 'Helped a peer understand a difficult concept.', 
        assessmentHistory: [{ name: 'Q1', score: 90 }, { name: 'Q2', score: 95 }, { name: 'Q3', score: 98 }],
        submissionPatterns: [ { name: 'On Time', value: 20, fill: 'hsl(var(--chart-2))' }, { name: 'Late', value: 0, fill: 'hsl(var(--chart-4))' }, { name: 'Missing', value: 0, fill: 'hsl(var(--chart-1))' } ],
        behavioralObservations: [ { date: '10/29/2024', note: 'Consistently on task and focused during independent work time.', tags: ['#OnTask'] } ],
        communicationHistory: [ { date: '10/22/2024', type: 'Parent Communication', summary: 'Emailed Dad to share positive progress.' } ]
    },
];

// In-memory store for quiz results for the demo
const mockQuizResults: QuizResult[] = [
    // Alice
    { id: 'qr-1', studentId: '1', quizName: 'Fractions', savedAt: Timestamp.fromDate(new Date('2024-05-20T10:00:00Z')), quizData: { questions: [ {answer: 'a'}, {answer: 'b'}, {answer: 'c'}, {answer: 'd'}]}}, // 80%
    { id: 'qr-2', studentId: '1', quizName: 'Decimals', savedAt: Timestamp.fromDate(new Date('2024-05-22T11:00:00Z')), quizData: { questions: [ {answer: 'a'}, {answer: 'b'}, {answer: 'c'}, {answer: 'd'}, {answer: 'e'}]}}, // 100%
    // Bob
    { id: 'qr-3', studentId: '2', quizName: 'Photosynthesis', savedAt: Timestamp.fromDate(new Date('2024-05-21T09:00:00Z')), quizData: { questions: [ {answer: 'a'}, {answer: 'b'}]}}, // 40%
    // Charlie
    { id: 'qr-4', studentId: '3', quizName: 'The Solar System', savedAt: Timestamp.fromDate(new Date('2024-05-19T14:00:00Z')), quizData: { questions: [ {answer: 'a'}]}}, // 20%
    { id: 'qr-5', studentId: '3', quizName: 'Gravity', savedAt: Timestamp.fromDate(new Date('2024-05-23T15:00:00Z')), quizData: { questions: [ {answer: 'a'}, {answer: 'b'}]}}, // 40%
    // Diana
    { id: 'qr-6', studentId: '4', quizName: 'The Solar System', savedAt: Timestamp.fromDate(new Date('2024-05-24T10:30:00Z')), quizData: { questions: [ {answer: 'a'}, {answer: 'b'}, {answer: 'c'}, {answer: 'd'}, {answer: 'e'}]}}, // 100%
];


export async function addStudent(name: string, className: string, accommodations?: string[], lastPositiveNote?: string): Promise<string> {
    console.log(`Mock addStudent called with: ${name}, ${className}`);
    const newStudent = {
        id: (mockStudentsData.length + 1).toString(),
        name,
        className,
        createdAt: new Date().toISOString(),
        avatar: 'https://placehold.co/100x100.png',
        trend: 'stable' as const,
        alerts: { missingAssignments: 0, attendanceConcern: false, behavioralNote: false },
        accommodations: accommodations || [],
        lastPositiveNote: lastPositiveNote || "Newly added student.",
        assessmentHistory: [],
        submissionPatterns: [ { name: 'On Time', value: 0, fill: 'hsl(var(--chart-2))' }, { name: 'Late', value: 0, fill: 'hsl(var(--chart-4))' }, { name: 'Missing', value: 0, fill: 'hsl(var(--chart-1))' } ],
        behavioralObservations: [],
        communicationHistory: [],
    };
    // This is not a type error, it's just how we have to add to a mock in-memory array.
    (mockStudentsData as any).push(newStudent);
    return newStudent.id;
}

function calculateMetrics(studentId: string) {
    const results = mockQuizResults.filter(r => r.studentId === studentId);
    const quizzesCompleted = results.length;
    
    if (quizzesCompleted === 0) {
        return { 
            quizzesCompleted: 0, 
            averageScore: 0,
            status: 'Needs Attention' as const,
            lastActivityDate: "No activity yet"
        };
    }
    
    // For mock purposes, we'll generate a "score" based on number of questions (e.g., 20 points per question)
    const totalPossibleScore = results.reduce((acc, curr) => acc + curr.quizData.questions.length * 20, 0);
    // Let's assume a mock score where they get 80% of questions right on average
    const totalActualScore = results.reduce((acc, curr) => {
      const questionCount = curr.quizData.questions.length;
      // Let's simulate different scores for different students for better visualization
      if (studentId === '1') return acc + (questionCount * 18); // 90%
      if (studentId === '2') return acc + (questionCount * 12); // 60%
      if (studentId === '3') return acc + (questionCount * 15); // 75%
      if (studentId === '4') return acc + (questionCount * 19); // 95%
      return acc + (questionCount * 15); // 75%
    }, 0);

    const averageScore = totalPossibleScore > 0 ? Math.round((totalActualScore / totalPossibleScore) * 100) : 0;

    let status: 'On Track' | 'Needs Attention' | 'Excelling' = 'On Track';
    if (averageScore < 70) {
        status = 'Needs Attention';
    } else if (averageScore >= 90) {
        status = 'Excelling';
    }

    const lastActivity = results.reduce((latest, current) => {
        return current.savedAt.seconds > latest.savedAt.seconds ? current : latest;
    });

    return { 
        quizzesCompleted, 
        averageScore,
        status,
        lastActivityDate: lastActivity.savedAt.toDate().toLocaleDateString()
    };
}


export async function getStudents(): Promise<Student[]> {
    console.log("Mock getStudents called.");
    // Combine static and calculated data
    return mockStudentsData.map(student => {
        const metrics = calculateMetrics(student.id);
        return {
            ...student,
            ...metrics,
        };
    });
}

export async function saveQuizResult(studentId: string, quizName: string, quizData: any): Promise<string> {
    console.log(`Mock saveQuizResult called for studentId: ${studentId}`);
    const newResult: QuizResult = {
        id: `qr-${mockQuizResults.length + 1}`,
        studentId,
        quizName,
        quizData,
        savedAt: Timestamp.now(),
    };
    mockQuizResults.push(newResult);
    return newResult.id;
}

export async function getStudentResults(studentId: string): Promise<QuizResult[]> {
    console.log(`Mock getStudentResults called for studentId: ${studentId}`);
    return mockQuizResults.filter(r => r.studentId === studentId);
}
