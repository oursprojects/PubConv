"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

export function MobileNativeProvider() {
    const lastConnectedRef = useRef<boolean>(true);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        let cleanup: (() => void) | undefined;
        let listeners: { remove: () => void }[] = [];

        const init = async () => {
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

            // 2. Network Status
            try {
                const { Network } = await import("@capacitor/network");
                const status = await Network.getStatus();
                lastConnectedRef.current = status.connected;

                const handleNetworkStatusChange = (status: { connected: boolean }) => {
                    if (status.connected === lastConnectedRef.current) return;
                    toast.dismiss("network-status");
                    if (status.connected) {
                        toast.success("Back online", { id: "network-status", duration: 3000 });
                    } else {
                        toast.error("You are offline", { id: "network-status", duration: Infinity });
                    }
                    lastConnectedRef.current = status.connected;
                };

                const netListener = await Network.addListener("networkStatusChange", handleNetworkStatusChange);
                listeners.push(netListener);
            } catch (e) {
                console.error("Network error:", e);
            }

            // 3. App Lifecycle & Back Button
            try {
                const { App } = await import("@capacitor/app");

                // Handle local navigation on back button
                const backListener = await App.addListener('backButton', (data: { canGoBack: boolean }) => {
                    if (pathname === '/' || pathname === '/login' || pathname === '/dashboard') {
                        // Exit if on major entry pages
                        App.exitApp();
                    } else if (data.canGoBack) {
                        window.history.back();
                    } else {
                        router.back();
                    }
                });
                listeners.push(backListener);

                // App State Changes (Background/Foreground)
                const stateListener = await App.addListener('appStateChange', async (state: { isActive: boolean }) => {
                    if (state.isActive) {
                        // Resume logic (e.g., refresh data)
                        console.log("App resumed");
                    } else {
                        // Pause logic (e.g., save state)
                        console.log("App backgrounded");
                    }
                });
                listeners.push(stateListener);
            } catch (e) {
                console.error("App lifecycle error:", e);
            }

            // 4. Keyboard Handling
            try {
                const { Keyboard } = await import("@capacitor/keyboard");
                // Optional: add listeners if specific UI adjustments are needed
            } catch (e) {
                console.error("Keyboard error:", e);
            }

            // 5. Hide Splash Screen (once app is ready)
            try {
                const { SplashScreen } = await import("@capacitor/splash-screen");
                await SplashScreen.hide({ fadeDuration: 300 });
            } catch (e) {
                console.error("Splash Screen error:", e);
            }
        };

        init();

        return () => {
            listeners.forEach(l => l.remove());
        };
    }, [pathname, router]);

    return null;
}
