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
                "fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-300",
                "bg-red-500 text-white shadow-lg",
                isReconnecting && "bg-yellow-500 text-yellow-900"
            )}
        >
            {isReconnecting ? (
                <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Reconnecting...</span>
                </>
            ) : (
                <>
                    <WifiOff className="h-4 w-4" />
                    <span>You&apos;re offline. Check your connection.</span>
                </>
            )}
        </div>
    );
}
