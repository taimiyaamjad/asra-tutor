
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { predictRank } from '@/ai/flows/predict-rank';
import type { Prediction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Award, Building, TrendingUp, BookCheck, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const examDetails = {
    'Jee Main': { maxMarks: 300 },
    'Jee Advanced': { maxMarks: 360 },
    'NEET': { maxMarks: 720 },
};

export default function RankPredictorPage() {
  const [examType, setExamType] = useState<'Jee Main' | 'Jee Advanced' | 'NEET'>('Jee Main');
  const [marks, setMarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMarks = parseInt(marks);
    if (isNaN(parsedMarks)) {
      toast({
        title: 'Invalid Marks',
        description: 'Please enter a valid number for your marks.',
        variant: 'destructive',
      });
      return;
    }
    
    const maxMarks = examDetails[examType].maxMarks;
    if (parsedMarks < 0 || parsedMarks > maxMarks) {
        toast({
            title: 'Invalid Marks',
            description: `Marks for ${examType} should be between 0 and ${maxMarks}.`,
            variant: 'destructive',
        });
        return;
    }


    setIsLoading(true);
    setPrediction(null);
    try {
      const response = await predictRank({ examType, marks: parsedMarks });
      setPrediction(response);
    } catch (error) {
      console.error('Failed to predict rank:', error);
      toast({
        title: 'Prediction Failed',
        description: 'Could not generate prediction. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderResult = () => {
    if (isLoading) {
      return (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      );
    }

    if (prediction) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Your AI-Powered {examType} Prediction</CardTitle>
            <CardDescription>Based on your score of {marks} in {examType}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card className="p-4">
                    <CardHeader className="p-0 pb-2 flex-row items-center gap-2">
                         <TrendingUp className="h-5 w-5 text-primary" />
                         <CardTitle className="text-lg">Predicted Percentile / Score</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <p className="text-3xl font-bold">{prediction.predictedPercentileOrScore}</p>
                    </CardContent>
                </Card>
                <Card className="p-4">
                    <CardHeader className="p-0 pb-2 flex-row items-center gap-2">
                         <Award className="h-5 w-5 text-primary" />
                         <CardTitle className="text-lg">Predicted All-India Rank</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <p className="text-3xl font-bold">{prediction.predictedRank}</p>
                    </CardContent>
                </Card>
            </div>
            
             <Card className="p-4 bg-muted/50">
                <CardHeader className="p-0 pb-2 flex-row items-center gap-2">
                    <Info className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">Prediction Rationale</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <p className="text-sm text-muted-foreground">{prediction.predictionRationale}</p>
                </CardContent>
            </Card>

            <div>
                <h3 className="text-xl font-semibold flex items-center gap-2 mb-3"><BookCheck /> College Suggestions</h3>
                <div className="space-y-3">
                    {prediction.collegeSuggestions.map((college, index) => (
                        <Card key={index} className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-md">
                                    <Building className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-semibold">{college.collegeName}</p>
                                    <p className="text-sm text-muted-foreground">{college.collegeType} - {college.branchSuggestion}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setPrediction(null)}>Try Another Prediction</Button>
          </CardFooter>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Award /> Rank & College Predictor</CardTitle>
          <CardDescription>
            Enter your mock test score to get an AI-powered prediction of your rank and potential colleges for JEE or NEET.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="exam-type">Exam Type</Label>
              <Select
                value={examType}
                onValueChange={(value) => {
                    setExamType(value as 'Jee Main' | 'Jee Advanced' | 'NEET');
                    setMarks('');
                    setPrediction(null);
                }}
                disabled={isLoading}
              >
                <SelectTrigger id="exam-type">
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jee Main">JEE Main</SelectItem>
                  <SelectItem value="Jee Advanced">JEE Advanced</SelectItem>
                  <SelectItem value="NEET">NEET</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="marks">Your Score</Label>
              <Input
                id="marks"
                type="number"
                placeholder={`Enter marks out of ${examDetails[examType].maxMarks}`}
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !marks}>
              {isLoading ? 'Predicting...' : 'Predict My Rank'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {renderResult()}
    </div>
  );
}
