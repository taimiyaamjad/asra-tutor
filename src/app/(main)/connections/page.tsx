'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateConnections, type GenerateConnectionsOutput } from '@/ai/flows/generate-connections';
import { GitBranch } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Connection = GenerateConnectionsOutput['connections'][0];

export default function ConnectionsPage() {
  const [topic, setTopic] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const { toast } = useToast();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast({
        title: 'Topic required',
        description: 'Please enter a topic to find connections.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setConnections([]);
    setIsGenerated(false);
    try {
      const response = await generateConnections({ topic });
      setConnections(response.connections);
      setIsGenerated(true);
    } catch (error) {
      console.error('Failed to generate connections:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate connections. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (isGenerated && connections.length > 0) {
      return (
        <div className="space-y-4">
          {connections.map((conn, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-xl">{conn.subject}</CardTitle>
                <CardDescription>{conn.concept}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{conn.explanation}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    return (
        <div className="text-center text-muted-foreground py-16">
            <p>Connections for your topic will appear here.</p>
        </div>
    );
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch /> Connections Explorer
          </CardTitle>
          <CardDescription>
            Enter a topic and discover how it links to different fields of study.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleGenerate}>
          <CardContent>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Photosynthesis"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !topic}>
              {isLoading && (
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              Find Connections
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {renderContent()}
    </div>
  );
}
