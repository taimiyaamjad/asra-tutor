
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, BookOpen, Target, Mail } from 'lucide-react';
import Image from 'next/image';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
                src="https://taimiyaamjad.github.io/dev/asra-tutor.png"
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
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">
                  How It Works
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Three Simple Steps to Success
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Getting started with your personal AI tutor is as easy as one, two, three.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-12 py-12 lg:grid-cols-3">
              <div className="grid gap-1 text-center">
                <h3 className="text-lg font-bold">1. Sign Up</h3>
                <p className="text-sm text-muted-foreground">
                  Create your account in just a few clicks and tell us about your learning goals.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <h3 className="text-lg font-bold">2. Start Learning</h3>
                <p className="text-sm text-muted-foreground">
                  Use the AI Chat to ask questions, or generate quizzes to test your knowledge.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <h3 className="text-lg font-bold">3. Track Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Watch your skills grow and your scores improve on your personal dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>
         <section id="contact" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Contact Us</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Have questions or feedback? We'd love to hear from you.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <form className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 text-left">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input id="first-name" placeholder="John" required />
                    </div>
                    <div className="space-y-2 text-left">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input id="last-name" placeholder="Doe" required />
                    </div>
                </div>
                <div className="space-y-2 text-left">
                  <Label htmlFor="email">Email</Label>
                  <Input type="email" id="email" placeholder="john.doe@example.com" required />
                </div>
                 <div className="space-y-2 text-left">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Your message..." required />
                </div>
                <Button type="submit" className="w-full">
                  <Mail className="mr-2 h-4 w-4" /> Send Message
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
