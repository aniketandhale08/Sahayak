
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Sidebar, SidebarContent, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import Link from 'next/link';
import { BookOpen, BrainCircuit, LayoutDashboard, Rss, Wrench, Users, ScanLine, FileQuestion, GraduationCap, Clapperboard, Calendar, Video, ImageIcon, Mail, CalendarPlus, FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export const metadata: Metadata = {
  title: 'Sahayak',
  description: 'Your AI Education Assistant',
};

const tools = [
  { id: 'lesson-creator', icon: Users, name: 'AI Lesson Creator' },
  { id: 'exam-grader', icon: ScanLine, name: 'AI Exam Grader' },
  { id: 'explainer', icon: BookOpen, name: 'AI Teaching Explainer' },
  { id: 'planner', icon: Calendar, name: 'Weekly Planner' },
  { id: 'image-generator', icon: ImageIcon, name: 'Concept Image Generator' },
  { id: 'video-generator', icon: Video, name: 'Concept Video Generator' },
  { id: 'assessor', icon: FileQuestion, name: 'AI Student Assessor' },
  { id: 'storybook-generator', icon: GraduationCap, name: 'Storybook Generator' },
  { id: 'animated-storybook', icon: Clapperboard, name: 'Animated Storybook' },
  { id: 'worksheet-generator', icon: FileText, name: 'Worksheet Generator' },
];

const agents = [
    { id: 'academic-coordinator', icon: Rss, name: 'Multi-Agent Research' },
    { id: 'gmail-assistant', icon: Mail, name: 'Gmail Assistant' },
    { id: 'calendar-assistant', icon: CalendarPlus, name: 'Calendar Assistant' },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <SidebarProvider>
            <Sidebar>
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b">
                         <Link href="/" className="flex items-center justify-center" prefetch={false}>
                            <BookOpen className="h-8 w-8 text-secondary" />
                            <span className="ml-3 text-2xl font-bold text-sidebar-foreground">Sahayak</span>
                        </Link>
                    </div>
                    <SidebarContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href="/">
                                        <LayoutDashboard />
                                        Dashboard
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <Collapsible asChild>
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton>
                                            <Wrench />
                                            Tools
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent asChild>
                                        <SidebarMenuSub>
                                            {tools.map(tool => (
                                                <SidebarMenuSubItem key={tool.id}>
                                                    <SidebarMenuSubButton asChild>
                                                        <Link href={`/tools/${tool.id}`}>
                                                            <tool.icon />
                                                            {tool.name}
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                             <Collapsible asChild>
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton>
                                            <Rss />
                                            Agents
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                  <CollapsibleContent asChild>
                                      <SidebarMenuSub>
                                          {agents.map(agent => (
                                              <SidebarMenuSubItem key={agent.id}>
                                                  <SidebarMenuSubButton asChild>
                                                      <Link href={`/tools/${agent.id}`}>
                                                          <agent.icon />
                                                          {agent.name}
                                                      </Link>
                                                  </SidebarMenuSubButton>
                                              </SidebarMenuSubItem>
                                          ))}
                                      </SidebarMenuSub>
                                  </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        </SidebarMenu>
                    </SidebarContent>
                </div>
            </Sidebar>
            <SidebarInset>
                <div className="flex flex-col min-h-dvh">
                    <Header />
                    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
                        {children}
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
