"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Printer, Presentation, Copy } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useRef, useState } from "react";

interface OutputActionsProps {
  content: string | object;
  title?: string;
}

export function OutputActions({ content, title }: OutputActionsProps) {
  const { toast } = useToast();
  const [isPresenting, setIsPresenting] = useState(false);
  const presentationRef = useRef<HTMLDivElement>(null);


  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write('<html><head><title>' + (title || document.title) + '</title>');
      printWindow.document.write('<style>body{font-family: sans-serif; line-height: 1.6;} h1,h2,h3,h4,h5,h6{color: #333;} pre{white-space: pre-wrap; word-wrap: break-word; background: #f4f4f4; padding: 1rem; border-radius: 5px;} ul,ol{padding-left: 20px;} img{max-width: 100%; height: auto; border-radius: 8px;}</style>');
      printWindow.document.write('</head><body>');
      
      const contentToPrint = typeof content === 'string' 
        ? content.replace(/\n/g, '<br>') // Basic string formatting
        : `<pre>${JSON.stringify(content, null, 2)}</pre>`;
      
      printWindow.document.write(contentToPrint);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      
      // Use a timeout to ensure content is loaded before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handleCopy = () => {
    const textToCopy = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({ title: "Copied!", description: "The content has been copied to your clipboard." });
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast({ title: "Error", description: "Failed to copy content.", variant: "destructive" });
    });
  };

  const handlePresent = () => {
    const elem = presentationRef.current;
    if (elem) {
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsPresenting(true);
        } else {
            document.exitFullscreen();
            setIsPresenting(false);
        }
    } else {
        setIsPresenting(true);
    }
  };

  // Handle exiting fullscreen with the ESC key
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      setIsPresenting(false);
    }
  });

  const contentToDisplay = typeof content === 'string' 
    ? <ReactMarkdown className="prose dark:prose-invert max-w-none">{content}</ReactMarkdown>
    : <pre>{JSON.stringify(content, null, 2)}</pre>;

  return (
    <>
        <div ref={presentationRef} className={`${isPresenting ? 'fixed inset-0 bg-background z-50 p-8 overflow-auto' : 'hidden'}`}>
            {isPresenting && (
                <div className="max-w-4xl mx-auto">
                    {title && <h1 className="text-4xl font-bold mb-8">{title}</h1>}
                    {contentToDisplay}
                    <Button onClick={handlePresent} className="fixed top-4 right-4">Exit Presentation</Button>
                </div>
            )}
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print/PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePresent}>
                <Presentation className="mr-2 h-4 w-4" /> Present
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
        </div>
    </>
  );
}
