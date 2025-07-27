
import { BookOpen, Calendar, Image as ImageIcon, Video, FileQuestion, GraduationCap, Users, Clapperboard, ScanLine, Rss, Mail, CalendarPlus, FileText } from 'lucide-react';
import dynamic from 'next/dynamic';
import React from 'react';

// Use next/dynamic to lazy-load the components.
// This prevents all components from being bundled into the main chunk.
const LessonCreator = dynamic(() => import('@/components/lesson-creator').then(m => m.LessonCreator));
const ExamGrader = dynamic(() => import('@/components/exam-grader').then(m => m.ExamGrader));
const ExplainerTool = dynamic(() => import('@/components/explainer-tool').then(m => m.ExplainerTool));
const WeeklyPlanner = dynamic(() => import('@/components/weekly-planner').then(m => m.WeeklyPlanner));
const ImageGenerator = dynamic(() => import('@/components/image-generator').then(m => m.ImageGenerator));
const VideoGenerator = dynamic(() => import('@/components/video-generator').then(m => m.VideoGenerator));
const StudentAssessor = dynamic(() => import('@/components/student-assessor').then(m => m.StudentAssessor));
const StorybookGenerator = dynamic(() => import('@/components/storybook-generator').then(m => m.StorybookGenerator));
const AnimatedStorybook = dynamic(() => import('@/components/animated-storybook').then(m => m.AnimatedStorybook));
const AcademicCoordinatorAgent = dynamic(() => import('@/components/research-agent').then(m => m.AcademicCoordinatorAgent));
const GmailAssistant = dynamic(() => import('@/components/gmail-assistant').then(m => m.GmailAssistant));
const CalendarAssistant = dynamic(() => import('@/components/calendar-assistant').then(m => m.CalendarAssistant));
const WorksheetGenerator = dynamic(() => import('@/components/worksheet-generator').then(m => m.WorksheetGenerator));


// A record to map tool IDs to their respective components and metadata
export const allTools: Record<string, {
    icon: React.ElementType;
    title: string;
    description: string;
    component: React.ComponentType;
}> = {
  'lesson-creator': { icon: Users, title: 'AI Lesson Creator', description: 'Generate a complete lesson plan by orchestrating multiple AI agents.', component: LessonCreator, },
  'exam-grader': { icon: ScanLine, title: 'AI Exam Grader', description: 'Upload a handwritten exam paper and let AI grade it and provide feedback.', component: ExamGrader, },
  'explainer': { icon: BookOpen, title: 'AI Teaching Explainer', description: 'Get simplified teaching methods for any topic, text, or image.', component: ExplainerTool, },
  'planner': { icon: Calendar, title: 'Weekly Planner', description: 'Input your goals and constraints to generate a weekly teaching plan.', component: WeeklyPlanner, },
  'image-generator': { icon: ImageIcon, title: 'Concept Image Generator', description: 'Generate step-by-step images to explain complex concepts visually.', component: ImageGenerator, },
  'video-generator': { icon: Video, title: 'Concept Video Generator', description: 'Create an engaging video to explain a concept, with optional image input.', component: VideoGenerator, },
  'assessor': { icon: FileQuestion, title: 'AI Student Assessor', description: 'Generate quizzes to gauge student understanding and provide feedback.', component: StudentAssessor, },
  'storybook-generator': { icon: GraduationCap, title: 'Storybook Generator', description: 'Create engaging and educational storybooks with AI illustrations.', component: StorybookGenerator, },
  'animated-storybook': { icon: Clapperboard, title: 'Animated Storybook', description: 'Turn any story into an animated video with narration and illustrations.', component: AnimatedStorybook, },
  'worksheet-generator': { icon: FileText, title: 'AI Worksheet Generator', description: 'Upload an image of a lesson or poem to generate custom worksheets.', component: WorksheetGenerator, },
  'academic-coordinator': { icon: Rss, title: 'Multi-Agent Academic Research', description: 'Provide a topic, and the coordinator will orchestrate sub-agents to analyze it, find recent papers, and suggest future research directions.', component: AcademicCoordinatorAgent, },
  'gmail-assistant': { icon: Mail, title: 'Gmail Assistant', description: 'Use an agent that sends your prompt to an external n8n workflow to interact with your Gmail account.', component: GmailAssistant, },
  'calendar-assistant': { icon: CalendarPlus, title: 'Calendar Assistant', description: 'Provide an event description, and the agent will send it to your n8n webhook to create a calendar event.', component: CalendarAssistant, }
};
