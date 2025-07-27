
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { WelcomeClient } from '@/components/welcome-client';
import { Infinity } from "lucide-react";

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-4 font-headline mt-8">
        ChatVerse
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
        Dive into vibrant chat rooms. Connect, share, and shine in a community that never sleeps.
      </p>
      <WelcomeClient />
      <footer className="absolute bottom-4 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} ChatVerse. All rights reserved.</p>
      </footer>
    </div>
  );
}

function LoadingScreen() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <div className="flex flex-col items-center gap-4">
              <Infinity className="h-16 w-16 text-primary animate-pulse" />
              <p className="text-muted-foreground">Loading Your Experience...</p>
            </div>
        </div>
    );
}

export default function WelcomePage() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/home');
        }
    }, [status, router]);

    if (status === 'loading') {
        return <LoadingScreen />;
    }

    if (status === 'unauthenticated') {
        return <WelcomeScreen />;
    }

    return <LoadingScreen />;
}
