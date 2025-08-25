import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle } from 'lucide-react';

const resources = [
  {
    topic: 'Linear Algebra',
    type: 'PDF',
    dateAdded: '2023-10-26',
    status: 'Published',
  },
  {
    topic: 'Organic Chemistry',
    type: 'Video',
    dateAdded: '2023-10-24',
    status: 'Draft',
  },
  {
    topic: 'Shakespearean Literature',
    type: 'Article',
    dateAdded: '2023-10-22',
    status: 'Published',
  },
  {
    topic: 'Quantum Mechanics',
    type: 'Interactive Quiz',
    dateAdded: '2023-10-20',
    status: 'Archived',
  },
];

export default function AdminPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Learning Resources</CardTitle>
          <CardDescription>
            Manage educational materials available to users.
          </CardDescription>
        </div>
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Add New Resource
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Topic</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => (
              <TableRow key={resource.topic}>
                <TableCell className="font-medium">{resource.topic}</TableCell>
                <TableCell>{resource.type}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      resource.status === 'Published'
                        ? 'default'
                        : 'secondary'
                    }
                    className={
                      resource.status === 'Published'
                        ? 'bg-green-600/20 text-green-700 hover:bg-green-600/30 dark:bg-green-400/20 dark:text-green-400'
                        : resource.status === 'Draft'
                        ? 'bg-yellow-600/20 text-yellow-700 hover:bg-yellow-600/30 dark:bg-yellow-400/20 dark:text-yellow-400'
                        : 'bg-gray-600/20 text-gray-700 hover:bg-gray-600/30 dark:bg-gray-400/20 dark:text-gray-400'
                    }
                  >
                    {resource.status}
                  </Badge>
                </TableCell>
                <TableCell>{resource.dateAdded}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                    <span className="sr-only">Actions</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
