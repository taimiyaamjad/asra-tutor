
'use client';

import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp, runTransaction, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useParams, useRouter } from 'next/navigation';
import type { Post, Comment as CommentType, AppUser } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useToast } from '@/hooks/use-toast';


export default function PostPage() {
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<CommentType[]>([]);
    const [isLoadingPost, setIsLoadingPost] = useState(true);
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const params = useParams();
    const postId = params.postId as string;
    const router = useRouter();
    const [user] = useAuthState(auth);
    const [appUser, setAppUser] = useState<AppUser | null>(null);
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
        if (postId) {
            const postRef = doc(db, 'posts', postId);
            const unsubscribePost = onSnapshot(postRef, (docSnap) => {
                if (docSnap.exists()) {
                    setPost({ id: docSnap.id, ...docSnap.data() } as Post);
                } else {
                    console.log("No such document!");
                    setPost(null); // Set post to null if not found
                }
                setIsLoadingPost(false);
            });
            
            const commentsQuery = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
            const unsubscribeComments = onSnapshot(commentsQuery, (querySnapshot) => {
                const commentsData: CommentType[] = [];
                querySnapshot.forEach((doc) => {
                    commentsData.push({ id: doc.id, ...doc.data() } as CommentType);
                });
                setComments(commentsData);
                setIsLoadingComments(false);
            });

            return () => {
                unsubscribePost();
                unsubscribeComments();
            };
        }
    }, [postId]);

    const handleAddComment = async () => {
        if (!user || !appUser || !newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const postRef = doc(db, 'posts', postId);
            const commentCollectionRef = collection(db, 'posts', postId, 'comments');

            await runTransaction(db, async (transaction) => {
                 const postDoc = await transaction.get(postRef);
                 if (!postDoc.exists()) {
                    throw "Post does not exist!";
                }
                
                // Add the new comment
                const newCommentRef = doc(commentCollectionRef);
                transaction.set(newCommentRef, {
                    content: newComment,
                    authorId: user.uid,
                    authorName: `${appUser.firstName || ''} ${appUser.lastName || ''}`.trim() || appUser.email,
                    authorPhotoURL: appUser.photoURL || null,
                    createdAt: serverTimestamp(),
                });

                // Increment the comment count
                const newCommentCount = (postDoc.data().commentCount || 0) + 1;
                transaction.update(postRef, { commentCount: newCommentCount });
            });
            
            setNewComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
            toast({ title: "Failed to add comment", description: "Please try again later.", variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeletePost = async () => {
        if (!user || !post) return;
        if (appUser?.role !== 'admin' && user.uid !== post.authorId) return;


        if (confirm('Are you sure you want to delete this post and all its comments? This action cannot be undone.')) {
            try {
                await deleteDoc(doc(db, 'posts', postId));
                toast({ title: "Post deleted successfully" });
                router.push('/question-realm');
            } catch (error) {
                console.error("Error deleting post:", error);
                toast({ title: "Failed to delete post", variant: 'destructive' });
            }
        }
    };
    
    if (isLoadingPost) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </CardContent>
            </Card>
        );
    }
    
    if (!post) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Post not found</h2>
                <p className="text-muted-foreground">The post you are looking for does not exist or has been deleted.</p>
                <Button onClick={() => router.push('/question-realm')} className="mt-4">Back to Question Realm</Button>
            </div>
        )
    }
    
    const canDelete = user && (appUser?.role === 'admin' || user.uid === post.authorId);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <Button variant="ghost" onClick={() => router.push('/question-realm')} className="pl-0">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to all posts
                </Button>
                {canDelete && (
                    <Button variant="destructive" size="sm" onClick={handleDeletePost}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Post
                    </Button>
                )}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{post.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 pt-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={post.authorPhotoURL || undefined} />
                            <AvatarFallback>{post.authorName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{post.authorName}</span>
                        <span className="text-xs text-muted-foreground">
                            • {post.createdAt ? format(post.createdAt.toDate(), 'PPP') : ''}
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap">{post.content}</p>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold">Comments ({comments.length})</h2>

            <div className="space-y-4">
                {isLoadingComments ? (
                    Array.from({length: 2}).map((_, i) => (
                        <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>
                    ))
                ) : comments.length > 0 ? (
                    comments.map(comment => (
                        <Card key={comment.id} className="p-4">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-8 w-8 border">
                                    <AvatarImage src={comment.authorPhotoURL || undefined} />
                                    <AvatarFallback>{comment.authorName.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{comment.authorName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : ''}
                                        </p>
                                    </div>
                                    <p className="mt-1 whitespace-pre-wrap">{comment.content}</p>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <p className="text-muted-foreground text-center py-8">No comments yet. Be the first to reply!</p>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Add your comment</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="grid w-full gap-2">
                        <Textarea 
                            placeholder={user ? "Type your comment here." : "Please log in to comment."}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            disabled={isSubmitting || !user}
                        />
                     </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleAddComment} disabled={isSubmitting || !user || !newComment.trim()}>
                        {isSubmitting ? 'Posting...' : <><Send className="mr-2 h-4 w-4" /> Post Comment</>}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
