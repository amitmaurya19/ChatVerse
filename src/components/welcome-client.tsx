"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export function WelcomeClient() {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button
        onClick={() => router.push("/login")}
        size="lg"
        className="font-bold text-lg"
      >
        Get Started
      </Button>
    </div>
  );
}
