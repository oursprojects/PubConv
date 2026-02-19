"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function MobileNativeProvider() {
    const lastConnectedRef = useRef<boolean>(true);

    useEffect(() => {
        let cleanup: (() => void) | undefined;

        const init = async () => {
            // Dynamically import Capacitor so it is NEVER bundled into the web build
            const { Capacitor } = await import("@capacitor/core");

            if (!Capacitor.isNativePlatform()) return;

            // 1. Status Bar
            try {
                const { StatusBar, Style } = await import("@capacitor/status-bar");
                await StatusBar.setOverlaysWebView({ overlay: true });
                await StatusBar.setStyle({ style: Style.Dark });
            } catch (e) {
                console.error("Status bar error:", e);
            }

            // 2. Network Status (debounced / deduped)
            try {
                const { Network } = await import("@capacitor/network");

                const status = await Network.getStatus();
                lastConnectedRef.current = status.connected;

                const handleNetworkStatusChange = (status: { connected: boolean }) => {
                    if (status.connected === lastConnectedRef.current) return;

                    toast.dismiss("network-status");

                    if (status.connected) {
                        toast.success("Back online", {
                            id: "network-status",
                            duration: 3000,
                            icon: "wifi",
                        });
                    } else {
                        toast.error("You are offline", {
                            id: "network-status",
                            duration: Infinity,
                            icon: "wifi-off",
                        });
                    }

                    lastConnectedRef.current = status.connected;
                };

                const listener = await Network.addListener(
                    "networkStatusChange",
                    handleNetworkStatusChange
                );

                cleanup = () => listener.remove();
            } catch (e) {
                console.error("Network error:", e);
            }
        };

        init();

        return () => {
            cleanup?.();
        };
    }, []);

    return null;
}
