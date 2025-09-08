
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { generateNotes, type GenerateNotesInput } from '@/ai/flows/generate-notes';
import { Notebook } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NotesPage() {
  const [topic, setTopic] = useState('');
  const [noteType, setNoteType] = useState<GenerateNotesInput['noteType']>('Key Points');
  const [notesContent, setNotesContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const { toast } = useToast();

  const handleGenerateNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) {
      toast({
        title: 'Topic required',
        description: 'Please enter a topic for the notes.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setNotesContent('');
    setIsGenerated(false);
    try {
      const response = await generateNotes({ topic, noteType });
      setNotesContent(response.notes);
      setIsGenerated(true);
    } catch (error) {
      console.error('Failed to generate notes:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate the notes. Please try again.',
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
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <br />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      );
    }

    if (isGenerated) {
      return (
        <article
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: notesContent.replace(/\\n/g, '<br />') }}
        />
      );
    }

    return (
        <div className="text-center text-muted-foreground">
            <p>Your generated notes will appear here.</p>
        </div>
    );
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Notebook /> Notes Generator
          </CardTitle>
          <CardDescription>
            Generate structured notes on any topic. Choose the level of detail you need.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleGenerateNotes}>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., The Industrial Revolution"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-type">Note Type</Label>
              <Select
                value={noteType}
                onValueChange={(value) => setNoteType(value as GenerateNotesInput['noteType'])}
                disabled={isLoading}
              >
                <SelectTrigger id="note-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Key Points">Key Points</SelectItem>
                  <SelectItem value="Simple">Simple</SelectItem>
                  <SelectItem value="Deep Notes">Deep Notes</SelectItem>
                </SelectContent>
              </Select>
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
              Generate Notes
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card className="h-full overflow-hidden">
        <CardHeader>
          <CardTitle>Generated Notes</CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-8rem)] p-0">
          <ScrollArea className="h-full px-6 pb-6">
            {renderContent()}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
