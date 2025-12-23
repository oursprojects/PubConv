"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [isReconnecting, setIsReconnecting] = useState(false);

    useEffect(() => {
        // Check initial state
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            setIsReconnecting(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setIsReconnecting(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Auto-reconnect attempt every 5 seconds when offline
    useEffect(() => {
        if (!isOnline) {
            const checkConnection = setInterval(async () => {
                setIsReconnecting(true);
                try {
                    // Try to fetch a small resource to check connectivity
                    const response = await fetch('/api/health', {
                        method: 'HEAD',
                        cache: 'no-store'
                    });
                    if (response.ok) {
                        setIsOnline(true);
                        setIsReconnecting(false);
                    }
                } catch {
                    // Still offline
                    setIsReconnecting(false);
                }
            }, 5000);

            return () => clearInterval(checkConnection);
        }
    }, [isOnline]);

    // Don't render anything if online
    if (isOnline) return null;

    return (
        <div
            className={cn(
                "fixed left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-medium transition-all duration-300 transform rounded-full border shadow-sm",
                // Mobile-friendly top positioning that avoids the status bar but floats above content
                "top-2 sm:top-4",
                isReconnecting
                    ? "bg-amber-100/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50 backdrop-blur-md"
                    : "bg-destructive/15 text-destructive border-destructive/20 backdrop-blur-md"
            )}
        >
            {isReconnecting ? (
                <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Connecting...</span>
                </>
            ) : (
                <>
                    <WifiOff className="h-3 w-3" />
                    <span>No internet connection</span>
                </>
            )}
        </div>
    );
}
