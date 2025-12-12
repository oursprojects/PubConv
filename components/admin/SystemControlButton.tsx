"use client";

import { useFormStatus } from "react-dom";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemControlButtonProps {
    isActive: boolean;
    labelActive: string;
    labelInactive: string;
    className?: string;
}

export function SystemControlButton({
    isActive,
    labelActive,
    labelInactive,
    className
}: SystemControlButtonProps) {
    const { pending } = useFormStatus();

    // If active, action is to disable -> "Disabling..."
    // If inactive, action is to enable -> "Enabling..."
    const loadingText = isActive ? "Disabling..." : "Enabling...";
    const buttonText = isActive ? labelActive : labelInactive;
    const variant = isActive ? "destructive" : "outline";

    return (
        <AnimatedButton
            type="submit"
            variant={variant}
            disabled={pending}
            className={cn("w-32 transition-all", className)}
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText}
                </>
            ) : (
                buttonText
            )}
        </AnimatedButton>
    );
}
