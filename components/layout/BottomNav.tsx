"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, User, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", icon: MessageSquare, label: "Chat" },
    { href: "/search", icon: Search, label: "Discover" },
    { href: "/profile", icon: User, label: "My Profile" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-background md:hidden">
            <div className="flex h-16 items-center justify-around px-4">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 text-xs transition-colors hover:text-primary",
                            pathname === item.href
                                ? "text-primary font-medium"
                                : "text-muted-foreground"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="sr-only">{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
