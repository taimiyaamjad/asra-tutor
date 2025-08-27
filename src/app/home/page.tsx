
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, BookOpen, Target } from 'lucide-react';
import Image from 'next/image';
import { PublicHeader } from '@/components/public-header';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <PublicHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary/10 to-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Unlock Your Potential with Asra, Your Personal AI Tutor
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Asra provides personalized learning paths, interactive
                    quizzes, and 24/7 AI chat to help you master any subject.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/login">Start Learning Now</Link>
                  </Button>
                </div>
              </div>
               <Image
                src="https://picsum.photos/600/400"
                width={600}
                height={400}
                alt="Hero"
                data-ai-hint="education learning"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  A Smarter Way to Learn
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is packed with features designed to accelerate
                  your learning and boost your confidence.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader className="flex flex-col items-center text-center">
                   <BrainCircuit className="mb-4 h-12 w-12 text-primary" />
                  <CardTitle>AI-Powered Chat</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  Get instant answers and explanations on any topic, anytime.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-col items-center text-center">
                   <BookOpen className="mb-4 h-12 w-12 text-primary" />
                  <CardTitle>Custom Quizzes</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  Generate quizzes to test your knowledge and track your progress.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-col items-center text-center">
                  <Target className="mb-4 h-12 w-12 text-primary" />
                  <CardTitle>Personalized Paths</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  Receive recommendations for what to learn next based on your goals.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; 2025 Asra AI. All rights reserved.
        </p>
        <div className="sm:ml-auto flex items-center gap-4 sm:gap-6">
          <p className="text-xs text-muted-foreground">
            Designed by Zenova (Taimiya Amjad)
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="#" className="text-xs hover:underline underline-offset-4">
              Terms of Service
            </Link>
            <Link href="#" className="text-xs hover:underline underline-offset-4">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
