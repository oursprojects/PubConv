"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface NetworkContextType {
    isOffline: boolean;
}

const NetworkContext = createContext<NetworkContextType>({ isOffline: false });

export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        let isMounted = true;
        let listener: { remove: () => void } | undefined;

        const initNetwork = async () => {
            try {
                const { Network } = await import('@capacitor/network');
                const status = await Network.getStatus();

                if (isMounted) {
                    setIsOffline(!status.connected);
                }

                listener = await Network.addListener('networkStatusChange', (status) => {
                    if (isMounted) {
                        const offline = !status.connected;
                        setIsOffline(offline);

                        if (offline) {
                            toast.error("You are offline", {
                                id: "network-status",
                                duration: Infinity,
                                description: "Some features may be limited."
                            });
                        } else {
                            toast.success("Back online", {
                                id: "network-status",
                                duration: 3000
                            });
                        }
                    }
                });
            } catch (error) {
                console.error("Network provider error:", error);
            }
        };

        initNetwork();

        return () => {
            isMounted = false;
            if (listener) listener.remove();
        };
    }, []);

    return (
        <NetworkContext.Provider value={{ isOffline }}>
            {children}
        </NetworkContext.Provider>
    );
}
