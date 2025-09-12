
'use client';

import React, { useState, useRef, useEffect } from 'react';
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
import { explainConceptWithImage } from '@/ai/flows/explain-concept-with-image';
import { Camera, Zap, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { marked } from 'marked';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SimulationPage() {
  const [concept, setConcept] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera not supported on this browser.');
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();
    
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }

  }, [toast]);

  const handleCaptureAndExplain = async () => {
    if (!concept.trim()) {
      toast({
        title: 'Concept required',
        description: 'Please enter a concept to explain.',
        variant: 'destructive',
      });
      return;
    }
    if (!videoRef.current || !canvasRef.current) return;

    setIsLoading(true);
    setExplanation('');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if(context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    }
    
    const photoDataUri = canvas.toDataURL('image/jpeg');

    try {
      const response = await explainConceptWithImage({ concept, photoDataUri });
      const htmlContent = await marked.parse(response.explanation);
      setExplanation(htmlContent);
    } catch (error) {
      console.error('Failed to generate explanation:', error);
      toast({
        title: 'Explanation Failed',
        description: 'Could not generate an explanation. Please try again with a clearer object.',
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
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      );
    }

    if (explanation) {
      return (
         <article
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: explanation }}
        />
      );
    }

    return (
      <div className="text-center text-muted-foreground py-16">
        <p>Your AI-generated explanation will appear here.</p>
      </div>
    );
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 h-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera /> Real-Life Simulation
          </CardTitle>
          <CardDescription>
            Point your camera at an object, enter a concept, and get a practical explanation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden border">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                     <Alert variant="destructive">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera access in your browser settings to use this feature.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="concept">Concept</Label>
            <Input
              id="concept"
              placeholder="e.g., Newton's First Law of Motion"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              disabled={isLoading || !hasCameraPermission}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleCaptureAndExplain}
            disabled={isLoading || !concept.trim() || !hasCameraPermission}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              'Explaining...'
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" /> Explain with this Object
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText /> Explanation</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-4">
            {renderContent()}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
