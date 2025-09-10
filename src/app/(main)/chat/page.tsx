
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { BrainCircuit, Send, User, Link2 } from 'lucide-react';
import type { ChatMessage, AiTutorChatOutput } from '@/lib/types';
import { aiTutorChat } from '@/ai/flows/ai-tutor-chat';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [user] = useAuthState(auth);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };
    
    setMessages((prev) => [...prev, userMessage, {id: 'typing', role: 'assistant', content: '', isTyping: true}]);
    setInput('');
    setIsLoading(true);

    try {
      // Save user message to Firestore
      await addDoc(collection(db, 'users', user.uid, 'chatHistory'), {
        ...userMessage,
        createdAt: serverTimestamp(),
      });

      const chatHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const response: AiTutorChatOutput = await aiTutorChat({
        question: input,
        context: chatHistory,
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        crossSubjectLinks: response.crossSubjectLinks
      };

      // Save assistant message to Firestore
       await addDoc(collection(db, 'users', user.uid, 'chatHistory'), {
        ...assistantMessage,
        createdAt: serverTimestamp(),
      });

      setMessages((prev) => [...prev.slice(0, -1), assistantMessage]);
    } catch (error) {
      console.error('Error with AI tutor chat:', error);
      setMessages((prev) => prev.slice(0, -1));
      toast({
        title: 'Error',
        description: 'Failed to get a response from the AI tutor. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="text-primary" />
          <span>AI Tutor Chat</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-4',
                  message.role === 'user' ? 'justify-end' : ''
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback>
                      <BrainCircuit className="h-5 w-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-col gap-2 max-w-md">
                    <div
                    className={cn(
                        'rounded-lg p-3 text-sm',
                        message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                    >
                    {message.isTyping ? (
                        <div className="flex items-center gap-1">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground delay-0"></span>
                            <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground delay-150"></span>
                            <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground delay-300"></span>
                        </div>
                    ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    </div>
                    {message.crossSubjectLinks && message.crossSubjectLinks.length > 0 && (
                        <Card>
                            <CardHeader className="p-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Link2 className="h-4 w-4" />
                                    Cross-Subject Links
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 text-sm space-y-2">
                                {message.crossSubjectLinks.map((link, index) => (
                                    <div key={index} className="border-l-2 border-primary pl-3">
                                        <p><strong>{link.subject} - {link.concept}:</strong> {link.explanation}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 border">
                     <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your studies..."
            className="min-h-0 flex-1 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
    </div>
  );
}
