import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Activity, Book, Target } from 'lucide-react';

// Icons for stats cards
const PenSquare = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
)
const MessageSquare = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
)

const stats = [
  {
    title: 'Quizzes Completed',
    value: '12',
    icon: PenSquare,
    change: '+2 this week',
  },
  {
    title: 'Questions Asked',
    value: '84',
    icon: MessageSquare,
    change: '+15 this week',
  },
  { title: 'Average Score', value: '88%', icon: Target, change: '-2%' },
  { title: 'Active Streak', value: '5 days', icon: Activity, change: '+1 day' },
];

const progress = [
  { subject: 'Algebra', value: 75 },
  { subject: 'Calculus', value: 45 },
  { subject: 'History', value: 92 },
  { subject: 'Physics', value: 60 },
];

const recommendedTopics = [
  {
    title: 'Introduction to Derivatives',
    description: 'Calculus',
    icon: Book,
  },
  {
    title: 'The World Wars',
    description: 'History',
    icon: Book,
  },
  {
    title: 'Newtonian Mechanics',
    description: 'Physics',
    icon: Book,
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground">
          Here's a summary of your learning journey with Asra.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Learning Progress</CardTitle>
            <CardDescription>
              Your progress across different subjects.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {progress.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{item.subject}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.value}%
                  </span>
                </div>
                <Progress value={item.value} aria-label={`${item.subject} progress`} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Topics</CardTitle>
            <CardDescription>
              Suggestions to continue your learning.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendedTopics.map((topic, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="rounded-md bg-muted p-2">
                  <topic.icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">{topic.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {topic.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
