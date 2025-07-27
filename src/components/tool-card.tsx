
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface ToolCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function ToolCard({ id, icon, title, description }: ToolCardProps) {
  return (
      <Card className="shadow-lg flex flex-col group hover:border-primary transition-all duration-300">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="flex-shrink-0 text-secondary">{icon}</div>
          <div className="flex-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex items-end">
            <Button variant="outline" className="w-full" asChild>
                <Link href={`/tools/${id}`}>
                    Launch Tool <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </Button>
        </CardContent>
      </Card>
  );
}
