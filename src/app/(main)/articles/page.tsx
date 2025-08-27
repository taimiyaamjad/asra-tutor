'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { generateArticle } from '@/ai/flows/generate-article';
import { FileText, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const trendingTopics = [
  'The Future of Artificial Intelligence',
  'The Science of Climate Change',
  'A Brief History of the Roman Empire',
  'Understanding Quantum Computing',
  'The Psychology of Procrastination',
  'The Art of Storytelling',
];

export default function ArticlesPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [articleContent, setArticleContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleTopicSelect = async (topic: string) => {
    setSelectedTopic(topic);
    setIsLoading(true);
    setArticleContent('');
    try {
      const response = await generateArticle({ topic });
      setArticleContent(response.article);
    } catch (error) {
      console.error('Failed to generate article:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate the article. Please try again.',
        variant: 'destructive',
      });
      setSelectedTopic(null); // Go back to list if generation fails
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedTopic(null);
    setArticleContent('');
  };

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-4">
          {selectedTopic && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="text-primary" />
              <span>{selectedTopic || 'Articles'}</span>
            </CardTitle>
            <CardDescription>
              {selectedTopic
                ? `Reading article on: ${selectedTopic}`
                : 'Select a topic to read an AI-generated article.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-8rem)] p-0">
        <ScrollArea className="h-full px-6 pb-6">
          {!selectedTopic ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trendingTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicSelect(topic)}
                  className="rounded-lg border p-4 text-left transition-all hover:bg-muted"
                >
                  <h3 className="font-semibold">{topic}</h3>
                  <p className="text-sm text-muted-foreground">
                    Click to generate article
                  </p>
                </button>
              ))}
            </div>
          ) : isLoading ? (
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
          ) : (
             <article
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: articleContent.replace(/\\n/g, '<br />') }}
              />
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
