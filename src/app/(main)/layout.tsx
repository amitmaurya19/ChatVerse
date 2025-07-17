"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header"; 

interface MainLayoutProps {
  children: React.ReactNode;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  if (status === 'loading') {
    return (
      <div className="flex flex-col h-screen">
          <div className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
             <div className="container flex h-16 items-center justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-9 w-9 rounded-full" />
             </div>
          </div>
          <div className="flex-1 container mx-auto p-8">
             <Skeleton className="h-10 w-1/3 mb-4" />
             <Skeleton className="h-6 w-1/2 mb-8" />
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <Skeleton className="h-48 rounded-lg" />
                <Skeleton className="h-48 rounded-lg" />
                <Skeleton className="h-48 rounded-lg" />
             </div>
          </div>
      </div>
    );
  }
  
  if (status === 'authenticated') {
    return <>{children}</>;
  }

  return null;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <AuthGuard>
      <div className="flex h-screen flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}
