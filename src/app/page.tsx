
import { WelcomeClient } from '@/components/welcome-client';

export default function WelcomePage() {
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
