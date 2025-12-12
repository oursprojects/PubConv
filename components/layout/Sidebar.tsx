"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, User, Search, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/chat", icon: MessageSquare, label: "Global Chat" },
    { href: "/search", icon: Search, label: "Discover" },
    { href: "/profile", icon: User, label: "Profile" },
    { href: "/feedback", icon: MessageCircle, label: "Feedback" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden border-r bg-muted/40 md:block md:w-64 lg:w-72 h-screen flex-col fixed left-0 top-0">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <img src="/logo.png" alt="PubConv" className="h-8 w-auto invert dark:invert-0" />
                    <span className="">PubConv</span>
                </Link>
                <div className="ml-auto">
                    {/* Could put notification bell or something here */}
                </div>
            </div>
            <div className="flex-1">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4 mt-4 gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                pathname === item.href
                                    ? "bg-muted text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="mt-auto p-4">
                {/* Placeholder for future user card or logout */}
            </div>
        </div>
    );
}
