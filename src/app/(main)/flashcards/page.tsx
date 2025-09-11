
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateFlashcards, type GenerateFlashcardsOutput } from '@/ai/flows/generate-flashcards';
import { Layers, UploadCloud, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

type Flashcard = GenerateFlashcardsOutput['flashcards'][0];

function FlashcardComponent({ flashcard }: { flashcard: Flashcard }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="w-full h-64 perspective-1000" onClick={() => setIsFlipped(!isFlipped)}>
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-700 transform-style-preserve-3d",
          isFlipped ? "rotate-y-180" : ""
        )}
      >
        <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 border rounded-lg bg-card text-card-foreground">
          <p className="text-xl font-semibold text-center">{flashcard.front}</p>
        </div>
        <div className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-6 border rounded-lg bg-secondary text-secondary-foreground">
          <p className="text-lg text-center">{flashcard.back}</p>
        </div>
      </div>
    </div>
  );
}


export default function FlashcardsPage() {
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setNotes(''); // Clear text notes if image is selected
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() && !imageFile) {
      toast({
        title: 'Input required',
        description: 'Please enter some notes or upload an image to generate flashcards.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setFlashcards([]);
    setIsGenerated(false);
    try {
        let photoDataUri: string | undefined = undefined;
        if (imageFile) {
            photoDataUri = await fileToBase64(imageFile);
        }

      const response = await generateFlashcards({
        notes: notes || undefined,
        photoDataUri,
      });
      setFlashcards(response.flashcards);
      setIsGenerated(true);
    } catch (error) {
      console.error('Failed to generate flashcards:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate flashcards. Please try again or use a clearer image.',
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
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }

    if (isGenerated && flashcards.length > 0) {
      return (
        <Carousel className="w-full max-w-lg mx-auto">
          <CarouselContent>
            {flashcards.map((card, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <FlashcardComponent flashcard={card} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      );
    }
    
    return (
        <div className="text-center text-muted-foreground py-16">
            <p>Your generated flashcards will appear here.</p>
        </div>
    );
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers /> Flashcards Generator
          </CardTitle>
          <CardDescription>
            Paste your notes or upload an image and the AI will automatically convert them into flashcards.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleGenerate}>
          <CardContent className="grid gap-6 md:grid-cols-2">
             <div className="grid w-full gap-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Option 1: Paste Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Paste your notes here..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setImageFile(null);
                  setImagePreview(null);
                }}
                disabled={isLoading}
                rows={8}
              />
            </div>
             <div className="grid w-full gap-2">
              <Label htmlFor="image-upload" className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4" /> Option 2: Upload Image
              </Label>
              <Input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} disabled={isLoading} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"/>
              {imagePreview && (
                <div className="mt-2 border rounded-md p-2">
                    <img src={imagePreview} alt="Notes preview" className="w-full h-auto max-h-32 object-contain rounded-md"/>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || (!notes && !imageFile)}>
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
              Generate Flashcards
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {renderContent()}
    </div>
  );
}

// Add some CSS for the 3D flip effect
const styles = `
.perspective-1000 { perspective: 1000px; }
.transform-style-preserve-3d { transform-style: preserve-3d; }
.rotate-y-180 { transform: rotateY(180deg); }
.backface-hidden { backface-visibility: hidden; }
`;

const styleSheet = typeof document !== 'undefined' ? document.createElement("style") : null;
if (styleSheet) {
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}
