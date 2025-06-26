"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Users } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const routes = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/my-rooms', label: 'My Rooms', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="container flex h-16 items-center justify-around">
        {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
                <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-md text-xs font-medium transition-colors",
                        isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
                    )}
                    >
                    <route.icon className="h-5 w-5" />
                    <span>{route.label}</span>
                </Link>
            );
        })}
      </div>
    </nav>
  );
}
