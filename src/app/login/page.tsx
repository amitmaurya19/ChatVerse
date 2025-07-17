"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image'; 

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      router.push("/home");
    }
  }, [session, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full border-2 border-primary/30 shadow-lg shadow-primary/10">
        <CardHeader className="text-center">
          {/* Logo/Banner Image */}
          <div className="mb-4">
            <Image
              src="/chatverse-login-banner.png" 
              alt="ChatVerse Logo"
              width={200} 
              height={50} 
              className="mx-auto" 
            />
          </div>
          <CardTitle className="text-2xl font-headline text-primary">Welcome</CardTitle>
          <CardDescription className="text-muted-foreground">Login to ChatVerse using your Google Account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="default" 
            className="w-full text-lg font-bold hover:bg-primary hover:text-primary-foreground" 
            onClick={() => signIn("google", { callbackUrl: "/home" })}
          >
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
