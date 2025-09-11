
'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BookText, Link as LinkIcon } from 'lucide-react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Resource } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookText /> Resources</CardTitle>
            <CardDescription>
              Curated articles, videos, and tools to aid your learning journey.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    </div>
                </Card>
            ))
          ) : resources.length > 0 ? (
            resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="hover:bg-muted/50 transition-colors p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-md">
                        <LinkIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{resource.name}</h3>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-1.5 mt-0.5">
                          <p>
                            Added {resource.createdAt ? formatDistanceToNow(resource.createdAt.toDate(), { addSuffix: true }) : '...'}
                          </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </a>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
                <BookText className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">No resources yet</h3>
                <p>Check back later for new learning materials.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
