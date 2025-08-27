
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { PublicHeader } from '@/components/public-header';

const teamMembers = [
  { name: 'Jane Doe', role: 'Founder & CEO', avatar: 'https://picsum.photos/100/100?a=1' },
  { name: 'John Smith', role: 'Lead AI Engineer', avatar: 'https://picsum.photos/100/100?a=2' },
  { name: 'Emily White', role: 'Head of Curriculum', avatar: 'https://picsum.photos/100/100?a=3' },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <PublicHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                About Asra
              </h1>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                We believe that education should be personal, engaging, and
                accessible to everyone. Asra was born from the idea that
                artificial intelligence can be a powerful tool to unlock human
                potential.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container grid items-center gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter">
                Our Mission
              </h2>
              <p className="text-muted-foreground">
                Our mission is to create a world where anyone can learn
                anything. We are committed to building an AI tutor that is not
                just a source of information, but a true learning companion.
                Asra adapts to your individual learning style, providing
                tailored support and encouragement every step of the way. We
                aim to make learning more intuitive, effective, and inspiring.
              </p>
            </div>
            <div className="flex justify-center">
              <Image
                src="https://picsum.photos/550/310"
                width="550"
                height="310"
                alt="Our Mission"
                data-ai-hint="team collaboration"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
              />
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Meet the Team
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                We are a passionate team of educators, engineers, and designers
                dedicated to revolutionizing the learning experience.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-8 py-12 sm:grid-cols-2 md:grid-cols-3">
              {teamMembers.map((member) => (
                <div key={member.name} className="flex flex-col items-center space-y-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; 2024 Asra AI. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
