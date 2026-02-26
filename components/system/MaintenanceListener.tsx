"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export function MaintenanceListener() {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkedAdmin, setCheckedAdmin] = useState(false);

    // Use refs to get current values in callbacks (avoid stale closures)
    const isAdminRef = useRef(isAdmin);
    const pathnameRef = useRef(pathname);

    useEffect(() => {
        isAdminRef.current = isAdmin;
    }, [isAdmin]);

    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    // Check if user is admin to bypass maintenance
    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();
                    if (data?.role === 'admin') {
                        setIsAdmin(true);
                        isAdminRef.current = true;
                    }
                }
            } catch (err) {
                console.error("MaintenanceListener Admin Check error:", err);
            } finally {
                setCheckedAdmin(true);
            }
        };
        checkAdmin();
    }, [supabase]);

    // Redirect logic using refs to get current values

    const handleRedirect = useCallback((isMaintenance: boolean) => {
        const currentPath = pathnameRef.current;
        const currentIsAdmin = isAdminRef.current;

        // Allow admins to stay on any page
        if (currentIsAdmin) {
            return;
        }

        // Pages exempt from maintenance redirect (login allowed for admin access)
        const isExemptPage = currentPath === '/login' || currentPath === '/maintenance';

        // If maintenance is ON and NOT on an exempt page -> Redirect to /maintenance
        if (isMaintenance && !isExemptPage) {
            router.push('/maintenance');
        }
        // If maintenance is OFF and ON maintenance page -> Redirect to home
        else if (!isMaintenance && currentPath === '/maintenance') {
            router.push('/');
        }
    }, [router]);

    useEffect(() => {
        // Wait until we've checked admin status
        if (!checkedAdmin) return;

        // 1. Initial Check
        const checkMaintenance = async () => {
            try {
                const { data } = await supabase
                    .from('app_config')
                    .select('value')
                    .eq('key', 'maintenance_mode')
                    .single();

                const isMaintenance = data?.value === true || data?.value === 'true';

                handleRedirect(isMaintenance);
            } catch (err) {
                console.error("MaintenanceListener check maintenance error:", err);
            }
        };
        checkMaintenance();

        // 2. Realtime Subscription for postgres changes
        const dbChannel = supabase
            .channel('maintenance_config_listener')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'app_config',
                    filter: 'key=eq.maintenance_mode'
                },
                (payload: RealtimePostgresChangesPayload<any>) => {

                    const isMaintenance = payload.new.value === true || payload.new.value === 'true';
                    handleRedirect(isMaintenance);

                    if (isMaintenance) {
                        toast.warning("System is entering maintenance mode.");
                    } else {
                        toast.success("System is back online.");
                    }
                }
            )
            .subscribe((status: string) => {

            });

        // 3. Broadcast listener for real-time admin broadcasts (must match admin channel name)
        const broadcastChannel = supabase.channel('global_system', {
            config: { broadcast: { self: true } }
        });

        broadcastChannel
            .on('broadcast', { event: 'maintenance_mode' }, (payload: { payload: { enabled: boolean } }) => {

                const isMaintenance = payload.payload?.enabled;
                handleRedirect(isMaintenance);

                if (isMaintenance) {
                    toast.warning("System is entering maintenance mode.");
                } else {
                    toast.success("System is back online.");
                }
            })
            .subscribe((status: string) => {

            });

        return () => {
            supabase.removeChannel(dbChannel);
            supabase.removeChannel(broadcastChannel);
        };
    }, [checkedAdmin, handleRedirect, supabase]);

    return null;
}

