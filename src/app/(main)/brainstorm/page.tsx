
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, MessageSquare, Lightbulb } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import type { Post, AppUser } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function BrainstormPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user] = useAuthState(auth);
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(postsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreatePost = async () => {
    if (!user || !appUser || !newPostTitle.trim() || !newPostContent.trim()) {
      toast({ title: "All fields are required.", variant: 'destructive'});
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        title: newPostTitle,
        content: newPostContent,
        authorId: user.uid,
        authorName: `${appUser.firstName || ''} ${appUser.lastName || ''}`.trim() || appUser.email,
        authorPhotoURL: appUser.photoURL || null,
        createdAt: serverTimestamp(),
        commentCount: 0,
      });
      toast({ title: "Post created successfully!"});
      setNewPostTitle('');
      setNewPostContent('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error creating post:", error);
      toast({ title: "Failed to create post.", description: "Please try again later.", variant: 'destructive'});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Lightbulb /> Brainstorm</CardTitle>
            <CardDescription>
              Ask questions, share ideas, and learn from the community.
            </CardDescription>
          </div>
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    New Post
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new post</DialogTitle>
                    <DialogDescription>
                        Share your question or idea with the community. Be clear and concise.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} placeholder="e.g., How does photosynthesis work?" />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="content">Your Question/Idea</Label>
                        <Textarea id="content" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Explain your question in detail..." rows={5}/>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreatePost} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Post'}
                    </Button>
                </DialogFooter>
            </DialogContent>
           </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
             Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4">
                    <div className="flex gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    </div>
                </Card>
            ))
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <Link href={`/brainstorm/${post.id}`} key={post.id} className="block">
                <Card className="hover:bg-muted transition-colors p-4">
                    <div className="flex items-start gap-4">
                         <Avatar className="h-10 w-10 border">
                            <AvatarImage src={post.authorPhotoURL} alt={post.authorName}/>
                            <AvatarFallback>{post.authorName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg">{post.title}</h3>
                            <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                                <p>by {post.authorName}</p>
                                <p>{post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : '...'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MessageSquare className="h-5 w-5" />
                            <span>{post.commentCount || 0}</span>
                        </div>
                    </div>
                </Card>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">No posts yet</h3>
                <p>Be the first to ask a question!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
