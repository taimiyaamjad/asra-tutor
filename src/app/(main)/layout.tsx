
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  BrainCircuit,
  LayoutDashboard,
  MessageSquare,
  PenSquare,
  Shield,
  LogOut,
  User,
  Settings,
  FileText,
  Users,
  Swords,
  ClipboardPen,
  Lightbulb,
  BarChart,
  Notebook,
  Award,
  Layers,
  GitBranch,
  BookText,
} from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { AppUser } from '@/lib/types';
import { PublicFooter } from '@/components/public-footer';
import { useToast } from '@/hooks/use-toast';


const menuItems = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    href: '/chat',
    icon: MessageSquare,
    label: 'AI Chat',
  },
  {
    href: '/group-chat',
    icon: Users,
    label: 'Group Chat',
  },
  {
    href: '/quiz',
    icon: PenSquare,
    label: 'Quiz Generator',
  },
   {
    href: '/heavenly-trial',
    icon: Swords,
    label: 'Heavenly Trial',
  },
  {
    href: '/accession',
    icon: ClipboardPen,
    label: 'Accession',
  },
  {
    href: '/rank-predictor',
    icon: Award,
    label: 'Rank Predictor',
  },
  {
    href: '/articles',
    icon: FileText,
    label: 'Articles',
  },
  {
    href: '/notes',
    icon: Notebook,
    label: 'Notes',
  },
  {
    href: '/flashcards',
    icon: Layers,
    label: 'Flashcards',
  },
  {
    href: '/brainstorm',
    icon: Lightbulb,
    label: 'Brainstorm',
  },
  {
    href: '/connections',
    icon: GitBranch,
    label: 'Connections',
  },
   {
    href: '/resources',
    icon: BookText,
    label: 'Resources',
  },
  {
    href: '/leaderboard',
    icon: BarChart,
    label: 'Leaderboard',
  },
  {
    href: '/admin',
    icon: Shield,
    label: 'Manage Resources',
    roles: ['admin'],
  },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<AppUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...userDoc.data(),
          } as AppUser);
        } else {
          // This case might happen if user is authenticated but their doc doesn't exist yet
           setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'student' });
        }
      } else {
        setUser(null);
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "Logged out successfully."});
    router.push('/login');
  };

  const visibleMenuItems = menuItems.filter(item => {
    if (!item.roles) return true; // Public item
    if (!user?.role) return false;
    return item.roles.includes(user.role);
  });
  
  if (loading) {
     return (
        <div className="flex h-screen items-center justify-center">
            <svg className="mr-2 h-16 w-16 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
     );
  }
  
  if (!user) {
    return null; // Or a redirect component
  }
  
  // Restrict access to admin page
  if(pathname === '/admin' && user.role !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar side="right">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <span className="text-lg font-semibold">Asra</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {visibleMenuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="group/menu-item flex w-full justify-start gap-2 overflow-hidden rounded-md p-2 text-left text-sm"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || undefined} alt={user.firstName || 'User'} />
                  <AvatarFallback>{(user.firstName || user.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start truncate group-data-[collapsible=icon]:hidden">
                  <span className="font-medium">{user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}</span>
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="left" align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <SidebarSeparator />
           <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} tooltip="Log Out">
                        <LogOut />
                        <span>Log Out</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <div className="flex items-center gap-2 md:hidden">
              <BrainCircuit className="h-6 w-6 text-primary" />
              <span className="font-bold">Asra</span>
            </div>
            <div className="flex-1" />
            <SidebarTrigger className="sm:hidden" />
          </header>
          <main className="flex-1 p-4 sm:px-6 sm:py-0 animate-fade-in">{children}</main>
          <div className="mt-auto">
            <PublicFooter />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
