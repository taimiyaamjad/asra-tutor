
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Trash2, Link as LinkIcon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, orderBy, query, doc, deleteDoc } from 'firebase/firestore';
import type { Resource } from '@/lib/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newResourceName, setNewResourceName] = useState('');
    const [newResourceLink, setNewResourceLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const resourcesData: Resource[] = [];
            querySnapshot.forEach((doc) => {
                resourcesData.push({ id: doc.id, ...doc.data() } as Resource);
            });
            setResources(resourcesData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleCreateResource = async () => {
        if (!newResourceName.trim() || !newResourceLink.trim()) {
            toast({ title: "Name and link are required.", variant: 'destructive'});
            return;
        }
        // Basic URL validation
        try {
            new URL(newResourceLink);
        } catch (_) {
            toast({ title: "Invalid URL", description: "Please enter a valid link.", variant: 'destructive'});
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'resources'), {
                name: newResourceName,
                link: newResourceLink,
                createdAt: serverTimestamp(),
            });
            toast({ title: "Resource created successfully!"});
            setNewResourceName('');
            setNewResourceLink('');
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error creating resource:", error);
            toast({ title: "Failed to create resource.", variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteResource = async (resourceId: string) => {
        if (confirm('Are you sure you want to delete this resource?')) {
            try {
                await deleteDoc(doc(db, 'resources', resourceId));
                toast({ title: 'Resource deleted successfully.' });
            } catch (error) {
                console.error("Error deleting resource:", error);
                toast({ title: 'Error deleting resource.', variant: 'destructive' });
            }
        }
    };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Manage Resources</CardTitle>
          <CardDescription>
            Add, edit, or delete educational materials available to users.
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Add New Resource
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Resource</DialogTitle>
                    <DialogDescription>
                        Add a link to an external article, video, or any other resource.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Resource Name</Label>
                        <Input id="name" value={newResourceName} onChange={(e) => setNewResourceName(e.target.value)} placeholder="e.g., Intro to Quantum Physics" />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="link">Link</Label>
                        <Input id="link" value={newResourceLink} onChange={(e) => setNewResourceLink(e.target.value)} placeholder="https://example.com/resource" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreateResource} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Resource'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Date Added</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                 Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
            ) : resources.map((resource) => (
              <TableRow key={resource.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <a href={resource.link} target="_blank" rel="noopener noreferrer" className="hover:underline">{resource.name}</a>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    {resource.createdAt ? format(resource.createdAt.toDate(), 'PPP') : '...'}
                </TableCell>
                <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteResource(resource.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!isLoading && resources.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No resources have been added yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
