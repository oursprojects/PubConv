"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [isReconnecting, setIsReconnecting] = useState(false);

    useEffect(() => {
        let listener: { remove: () => void } | undefined;

        const init = async () => {
            try {
                const { Network } = await import("@capacitor/network");
                const { Capacitor } = await import("@capacitor/core");

                if (!Capacitor.isNativePlatform()) {
                    setIsOnline(navigator.onLine);
                    const handleOnline = () => setIsOnline(true);
                    const handleOffline = () => setIsOnline(false);
                    window.addEventListener("online", handleOnline);
                    window.addEventListener("offline", handleOffline);
                    return () => {
                        window.removeEventListener("online", handleOnline);
                        window.removeEventListener("offline", handleOffline);
                    };
                }

                const status = await Network.getStatus();
                setIsOnline(status.connected);

                listener = await Network.addListener("networkStatusChange", (status) => {
                    setIsOnline(status.connected);
                });
            } catch (e) {
                // Fallback to navigator if plugin fails
                setIsOnline(navigator.onLine);
            }
        };

        init();

        return () => {
            listener?.remove();
        };
    }, []);

    // Health check logic remain similar but could be more robust
    useEffect(() => {
        if (!isOnline) {
            const checkConnection = setInterval(async () => {
                setIsReconnecting(true);
                try {
                    // Try to fetch a reliable public resource or Supabase URL
                    const response = await fetch('https://www.google.com/favicon.ico', {
                        method: 'HEAD',
                        mode: 'no-cors',
                        cache: 'no-store'
                    });
                    setIsOnline(true);
                    setIsReconnecting(false);
                } catch {
                    setIsReconnecting(false);
                }
            }, 10000);

            return () => clearInterval(checkConnection);
        }
    }, [isOnline]);

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
