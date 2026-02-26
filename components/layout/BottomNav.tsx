"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, User, Search, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/chat", icon: MessageSquare, label: "Chat" },
    { href: "/calendar", icon: CalendarDays, label: "Calendar" },
    { href: "/search", icon: Search, label: "Discover" },
    { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
    const pathname = usePathname();

    // Hide BottomNav on auth pages if they were somehow rendered within main layout
    // but typically they are in (auth) group.
    if (pathname === '/login' || pathname === '/register') return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)] md:hidden">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-200",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                            {isActive && (
                                <span className="absolute bottom-[env(safe-area-inset-bottom)] h-1 w-1 rounded-full bg-primary" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
