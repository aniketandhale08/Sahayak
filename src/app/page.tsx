
import { StudentDashboard } from '@/components/student-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Welcome to Sahayak!</CardTitle>
                    <CardDescription>Your AI Education Assistant. Select a tool from the sidebar to get started.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <div className="flex items-center text-muted-foreground">
                        <Wrench className="mr-2" />
                        <p>You can expand the "Tools" and "Agents" sections in the sidebar to access all available features.</p>
                    </div>
                 </CardContent>
            </Card>
            <StudentDashboard />
        </div>
    );
}
