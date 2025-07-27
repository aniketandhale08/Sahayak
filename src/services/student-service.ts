
"use server";

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, query, where, Timestamp } from 'firebase/firestore';

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

export interface GradingResult {
    studentName: string;
    className: string;
    subject: string;
    examTopic: string;
    score: number;
    totalMarks: number;
    feedback: string;
    gradedAt: Timestamp;
}

export async function addStudent(name: string, className: string, accommodations?: string[], lastPositiveNote?: string): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, "students"), {
            name: name,
            className: className,
            createdAt: Timestamp.now(),
            // Add default values for the new rich fields
            quizzesCompleted: 0,
            averageScore: 0,
            status: 'On Track',
            lastActivityDate: new Date().toLocaleDateString(),
            avatar: `https://placehold.co/100x100.png`,
            trend: 'stable',
            alerts: {
                missingAssignments: 0,
                attendanceConcern: false,
                behavioralNote: false,
            },
            accommodations: accommodations || [],
            lastPositiveNote: lastPositiveNote || "Welcome!",
            assessmentHistory: [],
            submissionPatterns: [ { name: 'On Time', value: 0, fill: 'hsl(var(--chart-2))' }, { name: 'Late', value: 0, fill: 'hsl(var(--chart-4))' }, { name: 'Missing', value: 0, fill: 'hsl(var(--chart-1))' } ],
            behavioralObservations: [],
            communicationHistory: [],
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw new Error("Could not add student to database.");
    }
}

export async function getStudents(): Promise<Student[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "students"));
        const students: Student[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            students.push({ 
                id: doc.id,
                name: data.name,
                className: data.className,
                createdAt: data.createdAt.toDate().toISOString(),
                quizzesCompleted: data.quizzesCompleted || 0,
                averageScore: data.averageScore || 0,
                status: data.status || 'On Track',
                lastActivityDate: data.lastActivityDate || new Date().toLocaleDateString(),
                avatar: data.avatar || `https://placehold.co/100x100.png`,
                trend: data.trend || 'stable',
                alerts: data.alerts || { missingAssignments: 0, attendanceConcern: false, behavioralNote: false },
                accommodations: data.accommodations || [],
                lastPositiveNote: data.lastPositiveNote || '',
                assessmentHistory: data.assessmentHistory || [],
                submissionPatterns: data.submissionPatterns || [ { name: 'On Time', value: 0, fill: 'hsl(var(--chart-2))' }, { name: 'Late', value: 0, fill: 'hsl(var(--chart-4))' }, { name: 'Missing', value: 0, fill: 'hsl(var(--chart-1))' } ],
                behavioralObservations: data.behavioralObservations || [],
                communicationHistory: data.communicationHistory || [],
            } as Student);
        });
        return students;
    } catch (e) {
        console.error("Error getting documents: ", e);
        throw new Error("Could not retrieve students from database.");
    }
}

export async function saveQuizResult(studentId: string, quizName: string, quizData: any): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, "quizResults"), {
            studentId: studentId,
            quizName: quizName,
            quizData: quizData,
            savedAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding quiz result: ", e);
        throw new Error("Could not save quiz result.");
    }
}

export async function getStudentResults(studentId: string): Promise<QuizResult[]> {
    try {
        const q = query(collection(db, "quizResults"), where("studentId", "==", studentId));
        const querySnapshot = await getDocs(q);
        const results: QuizResult[] = [];
        querySnapshot.forEach((doc) => {
            results.push({ id: doc.id, ...doc.data() } as QuizResult);
        });
        return results;
    } catch (e) {
        console.error("Error getting student results: ", e);
        throw new Error("Could not retrieve student results.");
    }
}

export async function saveGradingResult(result: Omit<GradingResult, 'gradedAt'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, "gradingResults"), {
            ...result,
            gradedAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (e) {
        console.error("Error saving grading result: ", e);
        throw new Error("Could not save grading result.");
    }
}
