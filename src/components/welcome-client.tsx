"use client";

import { signIn } from "next-auth/react";
import { Button } from "./ui/button";

export function WelcomeClient() {
    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => signIn("google", { callbackUrl: "/home" })}
              size="lg"
              className="font-bold text-lg"
            >
              Get Started with Google
            </Button>
        </div>
    )
}
