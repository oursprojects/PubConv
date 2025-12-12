"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

interface RealtimeContextType {
    isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType>({ isConnected: false });

export const useRealtime = () => useContext(RealtimeContext);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string>("user");
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        // Get current user info & check ban status
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role, is_banned")
                    .eq("id", user.id)
                    .single();

                if (profile?.is_banned) {
                    await supabase.auth.signOut();
                    router.push('/banned?reason=banned');
                    return;
                }

                setUserRole(profile?.role || "user");
            }
        };
        getUser();
    }, [supabase, router]);

    // Determine if we should listen based on pathname
    // We only want to re-run the effect if we transition from "should listen" using "should NOT listen" or vice versa
    const shouldListen = !(
        pathname?.startsWith('/admin') ||
        pathname === '/maintenance' ||
        pathname === '/login' ||
        pathname === '/register'
    );

    useEffect(() => {
        if (!shouldListen) return;

        console.log('🔌 [Global] Connecting to realtime system...');

        const channel = supabase.channel('global_system', {
            config: {
                broadcast: { self: true }
            }
        });

        channel
            .on('broadcast', { event: 'maintenance_mode' }, (payload: { payload: { enabled: boolean } }) => {
                console.log('🔧 [Global] Maintenance mode broadcast:', payload);
                if (payload.payload?.enabled && userRole !== 'admin') {
                    // Save current path to return after maintenance
                    router.push(`/maintenance?returnTo=${encodeURIComponent(pathname || '/chat')}`);
                }
            })
            .on('broadcast', { event: 'user_banned' }, async (payload: { payload: { userId: string } }) => {
                console.log('🚫 [Global] User banned broadcast:', payload);
                if (payload.payload?.userId === userId) {
                    await supabase.auth.signOut();
                    router.push('/banned?reason=banned');
                }
            })
            .on('broadcast', { event: 'user_deleted' }, async (payload: { payload: { userId: string } }) => {
                console.log('❌ [Global] User deleted broadcast:', payload);
                if (payload.payload?.userId === userId) {
                    await supabase.auth.signOut();
                    router.push('/banned?reason=deleted');
                }
            })
            .subscribe((status: string) => {
                console.log('Global system channel status:', status);
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                }
            });

        return () => {
            console.log('🔌 [Global] Disconnecting from realtime system...');
            supabase.removeChannel(channel);
        };
        // Removed specific pathname/router dependencies to prevent churn on every navigation
        // userRole might change, userId might change, shouldListen changes only on specific boundary crossing
    }, [supabase, shouldListen, userId, userRole]);

    return (
        <RealtimeContext.Provider value={{ isConnected }}>
            {children}
        </RealtimeContext.Provider>
    );
}
