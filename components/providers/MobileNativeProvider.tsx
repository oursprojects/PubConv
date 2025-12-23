"use client";

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export function MobileNativeProvider() {
    const { message: theme } = useTheme() as any; // forceful cast if needed, or just useTheme

    useEffect(() => {
        // Only run on native platforms
        if (!Capacitor.isNativePlatform()) return;

        // 1. Handle Status Bar
        const configureStatusBar = async () => {
            try {
                // Determine style based on system or theme (if accessible here, otherwise default to Dark for light mode content)
                // For simplified "native" feel, transparent overlay is often best.
                await StatusBar.setOverlaysWebView({ overlay: true });
                // We'll update style dynamically below
            } catch (e) {
                console.error("StatusBar error:", e);
            }
        };

        configureStatusBar();

        // 2. Handle Back Button
        const backListener = App.addListener('backButton', async (data) => {
            if (window.location.pathname === '/' || window.location.pathname === '/login') {
                // If on root or login, minimize app
                App.minimizeApp();
            } else {
                // Otherwise navigate back
                window.history.back();
            }
        });

        // 3. Network Status
        let lastConnected = true; // Assume online initially to avoid immediate "back online" if starting online

        const networkListener = Network.addListener('networkStatusChange', status => {
            // Deduplicate: only fire if status actually changed
            if (status.connected === lastConnected) return;
            lastConnected = status.connected;

            // Dismiss any existing network toasts to prevent stacking
            toast.dismiss('network-status');

            if (!status.connected) {
                Haptics.notification({ type: 'error' as any });
                // Use ID to Replace existing toast
                toast.error("You are offline.", { id: 'network-status', duration: 4000 });
            } else {
                // Use ID to Replace existing toast
                toast.success("Back online!", { id: 'network-status', duration: 2000 });
            }
        });

        // Cleanup
        return () => {
            backListener.then(h => h.remove());
            networkListener.then(h => h.remove());
        };
    }, []);

    // Effect to sync Status Bar with Theme Change
    // We need to access the actual resolved theme
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const updateStatusBarStyle = async () => {
            try {
                if (resolvedTheme === 'dark') {
                    await StatusBar.setStyle({ style: Style.Dark });
                } else {
                    await StatusBar.setStyle({ style: Style.Light });
                }
            } catch (e) { }
        };

        updateStatusBarStyle();
    }, [resolvedTheme]);

    return null; // This component renders nothing
}
