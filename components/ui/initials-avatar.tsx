"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

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
    size = "md",
    className,
    isAdmin = false
}: InitialsAvatarProps) {
    const initials = getInitials(username);

    return (
        <div
            className={cn(
                "relative flex shrink-0 items-center justify-center rounded-md font-medium",
                "transform-gpu will-change-transform",
                // Base styling: light background, dark text, border
                "bg-muted text-muted-foreground border border-border",
                sizeClasses[size],
                // Admin: golden border
                isAdmin && "border-amber-400",
                className
            )}
        >
            {initials}
        </div>
    );
}




