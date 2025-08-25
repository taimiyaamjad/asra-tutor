import { UserAuthForm } from '@/components/user-auth-form';
import { BrainCircuit } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="container relative flex h-screen flex-col items-center justify-center animate-fade-in">
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <BrainCircuit className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome to Asra
            </h1>
            <p className="text-sm text-muted-foreground">
              Your personal AI tutor. Enter your credentials to get started.
            </p>
          </div>
          <UserAuthForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{' '}
            <a
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
