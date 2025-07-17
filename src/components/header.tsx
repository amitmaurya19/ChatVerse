import Link from "next/link";
import { MainNav } from "./main-nav";
import { UserNav } from "./user-nav";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Left Side: Brand & Main Navigation */}
        <div className="flex items-center gap-6">
          <div>
            <span className="font-bold text-lg">ChatVerse</span>
          </div>
          <MainNav />
        </div>

        {/* This spacer pushes the user actions to the far right */}
        <div className="flex-1" />

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}