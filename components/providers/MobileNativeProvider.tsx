"use client";

import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Network } from "@capacitor/network";

export function MobileNativeProvider() {
    const lastConnectedRef = useRef<boolean>(true);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        // 1. Status Bar Logic
        const setStatusBar = async () => {
            try {
                // Transparent status bar (content draws behind it)
                await StatusBar.setOverlaysWebView({ overlay: true });
                // Dark icons (for light background) or Light icons (for dark background)
                // We'll assume dark theme mostly or sync with theme, but 'Dark' style means "Light text" usually
                await StatusBar.setStyle({ style: Style.Dark });
            } catch (e) {
                console.error("Status bar error:", e);
            }
        };
        setStatusBar();

        // 2. Network Status Logic (Debounced/Deduped)
        const checkNetwork = async () => {
            const status = await Network.getStatus();
            lastConnectedRef.current = status.connected;
        };
        checkNetwork();

        const handleNetworkStatusChange = (status: { connected: boolean }) => {
            // Only show toast if status ACTUALLY changed
            if (status.connected === lastConnectedRef.current) return;

            // Dismiss any existing network toasts to avoid stacking
            toast.dismiss('network-status');

            if (status.connected) {
                toast.success('Back online', {
                    id: 'network-status',
                    duration: 3000,
                    icon: 'wifi'
                });
            } else {
                toast.error('You are offline', {
                    id: 'network-status',
                    duration: Infinity, // Stay until connected
                    icon: 'wifi-off'
                });
            }

            lastConnectedRef.current = status.connected;
        };

        const listener = Network.addListener('networkStatusChange', handleNetworkStatusChange);

        return () => {
            listener.then(handle => handle.remove());
        };
    }, []);

    return null;
}
