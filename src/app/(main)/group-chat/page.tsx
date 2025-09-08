
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Send, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, query, orderBy, onSnapshot, DocumentData } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import type { AppUser } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';

interface GroupChatMessage {
  id: string;
  text: string;
  createdAt: any;
  uid: string;
  displayName: string;
  photoURL: string | null;
}

export default function GroupChatPage() {
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsub = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setAppUser({ uid: user.uid, ...doc.data() } as AppUser);
        }
      });
      return () => unsub();
    }
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'group-chat'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: GroupChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as GroupChatMessage);
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
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
    if (!input.trim() || !user || !appUser) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'group-chat'), {
        text: input,
        createdAt: serverTimestamp(),
        uid: user.uid,
        displayName: `${appUser.firstName} ${appUser.lastName || ''}`.trim() || appUser.email,
        photoURL: appUser.photoURL || null,
      });
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
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
            <Users className="text-primary" />
            <span>Group Chat</span>
          </CardTitle>
          <CardDescription>
            A place for all users to chat and collaborate.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-start gap-3',
                    message.uid === user?.uid ? 'flex-row-reverse' : ''
                  )}
                >
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={message.photoURL || undefined} alt={message.displayName} />
                    <AvatarFallback>{message.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                     <div
                        className={cn(
                        'max-w-md rounded-lg p-3 text-sm',
                        message.uid === user?.uid
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                    >
                        <p className="whitespace-pre-wrap">{message.text}</p>
                    </div>
                    <span className={cn("text-xs text-muted-foreground mt-1", message.uid === user?.uid ? 'text-right' : 'text-left')}>
                        {message.displayName}
                    </span>
                  </div>
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
              placeholder="Type your message here..."
              className="min-h-0 flex-1 resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              disabled={isLoading || !user}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim() || !user}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
