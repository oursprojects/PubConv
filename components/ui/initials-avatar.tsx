"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

import { Crown } from "lucide-react";

// Get initials from username
function getInitials(username: string): string {
    if (!username) return "?";
    return username.slice(0, 1).toUpperCase();
}

interface InitialsAvatarProps {
    username: string;
    size?: "sm" | "md" | "lg";
    className?: string;
    isAdmin?: boolean;
}

const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
};

export function InitialsAvatar({
    username,
    avatarUrl,
    size = "md",
    className,
    isAdmin = false
}: InitialsAvatarProps & { avatarUrl?: string | null }) {
    const initials = getInitials(username);

    // Check for valid, non-empty avatar URL
    const isValidAvatar = avatarUrl && avatarUrl.length > 0;

    return (
        <div className={cn("relative inline-flex shrink-0", sizeClasses[size], className)}>
            <div
                className={cn(
                    "flex h-full w-full items-center justify-center rounded-md font-medium overflow-hidden",
                    "transform-gpu will-change-transform",
                    // Base styling: light background, dark text, border layer
                    "bg-muted text-muted-foreground border-2 border-background ring-1 ring-border shadow-sm",
                    // Admin: golden border/ring
                    isAdmin && "ring-amber-400 border-amber-100"
                )}
            >
                {isValidAvatar ? (
                    <img
                        src={avatarUrl!}
                        alt={username}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    initials
                )}
            </div>
            {isAdmin && (
                <Crown
                    className={cn(
                        "absolute -top-1.5 -right-1.5 text-amber-500 fill-background z-10",
                        size === 'sm' ? "h-3 w-3 -top-1 -right-1" : "h-4 w-4"
                    )}
                />
            )}
        </div>
    );
}


