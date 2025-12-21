"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

export function ThemeSync() {
    const supabase = createClient();
    const { setTheme } = useTheme();
    const pathname = usePathname();

    useEffect(() => {
        const syncTheme = async () => {
            // Exclude auth routes
            if (pathname?.includes('/login') || pathname?.includes('/register')) {
                document.documentElement.removeAttribute('data-theme');
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('profiles')
                .select('theme')
                .eq('id', user.id)
                .single();

            if (data?.theme) {
                document.documentElement.setAttribute('data-theme', data.theme);
            }

            // Real-time Sync: Listen for changes to the user's profile theme
            const channel = supabase
                .channel(`theme_sync_${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${user.id}`,
                    },
                    (payload: any) => {
                        const newTheme = payload.new.theme;
                        if (newTheme) {
                            document.documentElement.setAttribute('data-theme', newTheme);
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        const cleanupPromise = syncTheme();

        // Listen for auth changes to re-sync (e.g., login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event: string, session: any) => {
                if (event === 'SIGNED_IN') syncTheme();
                if (event === 'SIGNED_OUT') {
                    document.documentElement.removeAttribute('data-theme');
                }
            }
        );

        return () => {
            subscription.unsubscribe();
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, [supabase, pathname]);

    return null;
}
