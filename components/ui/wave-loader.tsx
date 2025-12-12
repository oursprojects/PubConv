"use client";

import { cn } from "@/lib/utils";

interface WaveLoaderProps {
    className?: string;
}

export function WaveLoader({ className }: WaveLoaderProps) {
    return (
        <div className={cn("flex items-center gap-1 h-4", className)}>
            <div className="h-full w-1 bg-current animate-wave [animation-delay:-0.3s] rounded-full" />
            <div className="h-full w-1 bg-current animate-wave [animation-delay:-0.15s] rounded-full" />
            <div className="h-full w-1 bg-current animate-wave rounded-full" />
            <div className="h-full w-1 bg-current animate-wave [animation-delay:-0.15s] rounded-full" />
            <div className="h-full w-1 bg-current animate-wave [animation-delay:-0.3s] rounded-full" />
        </div>
    );
}
