
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import { allTools } from './components';


export default function ToolPage({ params }: { params: { toolId: string } }) {
    const tool = allTools[params.toolId];

    // If the toolId from the URL doesn't exist in our map, show a 404 page.
    if (!tool) {
        notFound();
    }

    const Icon = tool.icon;
    const Component = tool.component;

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
          <div className="flex-grow overflow-y-auto">
            <Component />
          </div>
        </Card>
    );
}

// This function tells Next.js which toolIds are possible.
export async function generateStaticParams() {
    return Object.keys(allTools).map((toolId) => ({
      toolId,
    }));
}
