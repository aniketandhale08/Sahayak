
import { BookOpen, Calendar, Image as ImageIcon, Video, FileQuestion, GraduationCap, Users, Clapperboard, ScanLine, Rss, Mail, CalendarPlus } from 'lucide-react';
import { ExplainerTool } from '@/components/explainer-tool';
import { WeeklyPlanner } from '@/components/weekly-planner';
import { ImageGenerator } from '@/components/image-generator';
import { VideoGenerator } from '@/components/video-generator';
import { StudentAssessor } from '@/components/student-assessor';
import { StorybookGenerator } from '@/components/storybook-generator';
import { LessonCreator } from '@/components/lesson-creator';
import { AnimatedStorybook } from '@/components/animated-storybook';
import { ExamGrader } from '@/components/exam-grader';
import { AcademicCoordinatorAgent } from '@/components/research-agent';
import { GmailAssistant } from '@/components/gmail-assistant';
import { CalendarAssistant } from '@/components/calendar-assistant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';

const allTools: Record<string, {
    icon: React.ElementType;
    title: string;
    description: string;
    component: React.ReactNode;
}> = {
  'lesson-creator': { icon: Users, title: 'AI Lesson Creator', description: 'Generate a complete lesson plan by orchestrating multiple AI agents.', component: <LessonCreator />, },
  'exam-grader': { icon: ScanLine, title: 'AI Exam Grader', description: 'Upload a handwritten exam paper and let AI grade it and provide feedback.', component: <ExamGrader />, },
  'explainer': { icon: BookOpen, title: 'AI Teaching Explainer', description: 'Get simplified teaching methods for any topic, text, or image.', component: <ExplainerTool />, },
  'planner': { icon: Calendar, title: 'Weekly Planner', description: 'Input your goals and constraints to generate a weekly teaching plan.', component: <WeeklyPlanner />, },
  'image-generator': { icon: ImageIcon, title: 'Concept Image Generator', description: 'Generate step-by-step images to explain complex concepts visually.', component: <ImageGenerator />, },
  'video-generator': { icon: Video, title: 'Concept Video Generator', description: 'Create an engaging video to explain a concept, with optional image input.', component: <VideoGenerator />, },
  'assessor': { icon: FileQuestion, title: 'AI Student Assessor', description: 'Generate quizzes to gauge student understanding and provide feedback.', component: <StudentAssessor />, },
  'storybook-generator': { icon: GraduationCap, title: 'Storybook Generator', description: 'Create engaging and educational storybooks with AI illustrations.', component: <StorybookGenerator />, },
  'animated-storybook': { icon: Clapperboard, title: 'Animated Storybook', description: 'Turn any story into an animated video with narration and illustrations.', component: <AnimatedStorybook />, },
  'academic-coordinator': { icon: Rss, title: 'Multi-Agent Academic Research', description: 'Provide a topic, and the coordinator will orchestrate sub-agents to analyze it, find recent papers, and suggest future research directions.', component: <AcademicCoordinatorAgent />, },
  'gmail-assistant': { icon: Mail, title: 'Gmail Assistant (via n8n Webhook)', description: 'Use an agent that sends your prompt to an external n8n workflow to interact with your Gmail account.', component: <GmailAssistant />, },
  'calendar-assistant': { icon: CalendarPlus, title: 'Calendar Assistant (via n8n Webhook)', description: 'Provide an event description, and the agent will send it to your n8n webhook to create a calendar event.', component: <CalendarAssistant />, }
};

export default function ToolPage({ params }: { params: { toolId: string } }) {
    const tool = allTools[params.toolId];

    if (!tool) {
        notFound();
    }

    const Icon = tool.icon;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Icon className="h-8 w-8 text-secondary" />
                    <div>
                        <CardTitle className="text-2xl">{tool.title}</CardTitle>
                        <CardDescription>{tool.description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            {tool.component}
        </Card>
    );
}
