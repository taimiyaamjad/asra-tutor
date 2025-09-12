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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { futureSelfMentor, type FutureSelfMentorOutput } from '@/ai/flows/future-self-mentor';
import { WandSparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { marked } from 'marked';

type CareerPath = 'Doctor' | 'IITian' | 'IAS Officer' | 'Scientist';

export default function FutureSelfPage() {
  const [career, setCareer] = useState<CareerPath | ''>('');
  const [currentActivity, setCurrentActivity] = useState('');
  const [advice, setAdvice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!career) {
      toast({
        title: 'Career path required',
        description: 'Please select your dream career.',
        variant: 'destructive',
      });
      return;
    }
    if (!currentActivity) {
         toast({
            title: 'Current activity required',
            description: 'Please tell your future self what you are doing.',
            variant: 'destructive',
        });
        return;
    }

    setIsLoading(true);
    setAdvice('');
    try {
      const response: FutureSelfMentorOutput = await futureSelfMentor({
        career,
        currentActivity,
      });
      const htmlContent = await marked.parse(response.advice);
      setAdvice(htmlContent);
    } catch (error) {
      console.error('Failed to get advice from future self:', error);
      toast({
        title: 'Mentorship Failed',
        description: 'Could not get advice from your future self. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
    const renderAdvice = () => {
        if (isLoading) {
            return (
                <div className="space-y-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            )
        }
        
        if (advice) {
            return (
                 <article
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: advice }}
                />
            )
        }
        
        return (
             <div className="text-center text-muted-foreground py-16">
                <p>Advice from your future self will appear here.</p>
            </div>
        )
    }


  return (
    <div className="grid md:grid-cols-2 gap-8 h-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WandSparkles /> Future-Self Mentor
          </CardTitle>
          <CardDescription>
            Get a motivational boost from an AI version of you that has already achieved your dreams.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleGetAdvice}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="career-path">Choose Your Dream Career</Label>
              <Select
                value={career}
                onValueChange={(value: CareerPath) => setCareer(value)}
                disabled={isLoading}
              >
                <SelectTrigger id="career-path">
                  <SelectValue placeholder="Select your future" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Doctor">Doctor</SelectItem>
                  <SelectItem value="IITian">IITian (Engineer/Tech)</SelectItem>
                  <SelectItem value="IAS Officer">IAS Officer (Civil Servant)</SelectItem>
                  <SelectItem value="Scientist">Scientist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-activity">What are you studying right now?</Label>
              <Textarea
                id="current-activity"
                placeholder="e.g., 'Revising Organic Chemistry for my exam tomorrow' or 'Feeling unmotivated to study physics...'"
                value={currentActivity}
                onChange={(e) => setCurrentActivity(e.target.value)}
                disabled={isLoading}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={isLoading || !career || !currentActivity}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                'Consulting the future...'
              ) : (
                <>
                  <WandSparkles className="mr-2 h-4 w-4" /> Get Advice
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
       <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>A Message From Your Future Self</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-4">
            {renderAdvice()}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
