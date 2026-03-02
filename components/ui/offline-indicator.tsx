"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        let cleanupNative: (() => void) | undefined;

        const initNativeNetwork = async () => {
            try {
                const { Capacitor } = await import("@capacitor/core");
                if (!Capacitor.isNativePlatform()) return;

                const { Network } = await import("@capacitor/network");
                const status = await Network.getStatus();
                setIsOnline(status.connected);

                const listener = await Network.addListener("networkStatusChange", (status: { connected: boolean }) => {
                    setIsOnline(status.connected);
                });

                cleanupNative = () => listener.remove();
            } catch {
                // Keep browser event fallback.
            }
        };

        initNativeNetwork();

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            cleanupNative?.();
        };
    }, []);

    if (isOnline) return null;

    return (
        <div
            className={cn(
                "fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-300",
                "bg-red-500 text-white shadow-lg"
            )}
        >
            <WifiOff className="h-4 w-4" />
            <span>You&apos;re offline. Check your connection.</span>
        </div>
    );
}
