"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

export function InstallPWA({ className }: { className?: string }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setDeferredPrompt(null);
        }
    };

    if (!isMounted) return null;
    if (!deferredPrompt) return null;

    return (
        <Button
            variant="outline"
            size="sm"
            className={cn("gap-2 animate-in fade-in slide-in-from-top-2", className)}
            onClick={handleInstallClick}
        >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Install App</span>
        </Button>
    );
}
