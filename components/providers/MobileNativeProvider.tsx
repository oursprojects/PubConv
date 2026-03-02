"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

export function MobileNativeProvider() {
    const lastConnectedRef = useRef<boolean>(true);
    const lastBackPressRef = useRef<number>(0);
    const pathname = usePathname();
    const pathnameRef = useRef(pathname);

    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    useEffect(() => {
        let cleanup: (() => void) | undefined;

        const init = async () => {
            const { Capacitor } = await import("@capacitor/core");
            if (!Capacitor.isNativePlatform()) return;

            const cleanups: Array<() => void> = [];

            try {
                const { StatusBar, Style } = await import("@capacitor/status-bar");
                await StatusBar.setOverlaysWebView({ overlay: false });
                await StatusBar.setStyle({ style: Style.Dark });
                await (StatusBar as any).setBackgroundColor?.({ color: "#111827" });
            } catch (e) {
                console.error("Status bar error:", e);
            }

            try {
                const { Keyboard } = await import("@capacitor/keyboard");
                await (Keyboard as any).setResizeMode?.({ mode: "body" });
                await (Keyboard as any).setScroll?.({ isDisabled: false });
            } catch (e) {
                console.error("Keyboard setup error:", e);
            }

            try {
                const { App } = await import("@capacitor/app");

                const backListener = await App.addListener("backButton", () => {
                    const currentPath = pathnameRef.current || "/";
                    const isRoot = currentPath === "/" || currentPath === "/chat";

                    if (!isRoot && window.history.length > 1) {
                        window.history.back();
                        return;
                    }

                    const now = Date.now();
                    if (now - lastBackPressRef.current < 1500) {
                        App.exitApp();
                        return;
                    }

                    lastBackPressRef.current = now;
                    toast.message("Press back again to exit");
                });

                cleanups.push(() => backListener.remove());
            } catch (e) {
                console.error("Back button setup error:", e);
            }

            try {
                const { Network } = await import("@capacitor/network");
                const { Haptics, NotificationType } = await import("@capacitor/haptics");

                const status = await Network.getStatus();
                lastConnectedRef.current = status.connected;

                const handleNetworkStatusChange = async (status: { connected: boolean }) => {
                    if (status.connected === lastConnectedRef.current) return;

                    toast.dismiss("network-status");

                    if (status.connected) {
                        await Haptics.notification({ type: NotificationType.Success });
                        toast.success("Back online", {
                            id: "network-status",
                            duration: 3000,
                            icon: "wifi",
                        });
                    } else {
                        await Haptics.notification({ type: NotificationType.Warning });
                        toast.error("You are offline", {
                            id: "network-status",
                            duration: Infinity,
                            icon: "wifi-off",
                        });
                    }

                    lastConnectedRef.current = status.connected;
                };

                const listener = await Network.addListener("networkStatusChange", handleNetworkStatusChange);
                cleanups.push(() => listener.remove());
            } catch (e) {
                console.error("Network error:", e);
            }

            try {
                const { SplashScreen } = await import("@capacitor/splash-screen");
                await SplashScreen.hide({ fadeDuration: 300 });
            } catch (e) {
                console.error("Splash Screen error:", e);
            }

            cleanup = () => {
                cleanups.forEach((fn) => fn());
            };
        };

        init();

        return () => {
            cleanup?.();
        };
    }, []);

    return null;
}
