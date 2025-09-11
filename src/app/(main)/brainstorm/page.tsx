
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, MessageSquare, Lightbulb, Trash2 } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import type { Post, AppUser } from '@/lib/types';
import { onSnapshot as docOnSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
      const unsub = docOnSnapshot(userDocRef, (doc) => {
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
    if (!user || !appUser) {
        toast({ title: "You must be logged in to create a post.", variant: 'destructive'});
        setIsDialogOpen(false);
        return;
    }
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({ title: "Title and content are required.", variant: 'destructive'});
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

  const handleDeletePost = async (postId: string) => {
      if (!user) return;
      
      const postToDelete = posts.find(p => p.id === postId);
      if (!postToDelete) return;

      if (appUser?.role !== 'admin' && user.uid !== postToDelete.authorId) return;

      if (confirm('Are you sure you want to delete this post and all its comments?')) {
          try {
              await deleteDoc(doc(db, 'posts', postId));
              toast({ title: 'Post deleted successfully.' });
          } catch(e) {
              console.error("Error deleting post:", e);
              toast({ title: 'Error deleting post.', variant: 'destructive' });
          }
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
        <CardContent className="space-y-2">
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
            posts.map((post) => {
              const canDelete = user && (appUser?.role === 'admin' || user.uid === post.authorId);
              return (
              <Card key={post.id} className="hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 p-2">
                      <Avatar className="h-8 w-8 border flex-shrink-0">
                        <AvatarImage src={post.authorPhotoURL || undefined} alt={post.authorName}/>
                        <AvatarFallback>{post.authorName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Link href={`/brainstorm/${post.id}`} className="block group">
                            <h3 className="font-semibold text-sm group-hover:underline truncate">{post.title}</h3>
                            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-1.5 mt-0.5">
                                <p className="truncate">by {post.authorName}</p>
                                <span className="hidden sm:inline">•</span>
                                <p>{post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : '...'}</p>
                            </div>
                        </Link>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2 text-muted-foreground ml-auto pl-1">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span className="text-xs">{post.commentCount || 0}</span>
                          </div>
                          {canDelete && (
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-6 w-6"
                                  onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeletePost(post.id);
                                  }}
                                  aria-label="Delete post"
                              >
                                  <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                          )}
                      </div>
                  </div>
              </Card>
            )})
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
