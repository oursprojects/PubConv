"use client";

import * as React from "react";
import { TopHeader } from "@/components/layout/TopHeader";
import { MaintenanceScreen } from "@/components/maintenance-screen";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";
import PageTransition from "@/components/page-transition";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = React.useState<any>(null);
    const [role, setRole] = React.useState('user');
    const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
    const [maintenanceMode, setMaintenanceMode] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const router = useRouter();
    const supabase = createClient();

    React.useEffect(() => {
        let isMounted = true;

        async function loadInitialData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!isMounted) return;

                if (!user) {
                    router.push('/login');
                    return;
                }

                setUser(user);

                // ... rest of loading logic
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role, avatar_url, is_banned')
                        .eq('id', user.id)
                        .single();

                    if (profile?.is_banned) {
                        router.push('/banned?reason=banned');
                        return;
                    }

                    setRole(profile?.role || 'user');
                    setAvatarUrl(profile?.avatar_url);
                }

                const { data: configs } = await supabase.from("app_config").select("*");
                const maintenanceModeRaw = configs?.find((c: any) => c.key === "maintenance_mode")?.value;
                const isMaintenance = maintenanceModeRaw === true || maintenanceModeRaw === 'true';
                setMaintenanceMode(isMaintenance);

            } catch (error) {
                console.error("Error loading layout data:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadInitialData();

        return () => {
            isMounted = false;
        };
    }, [supabase, router]);

    if (loading) {
        return (
            <div className="h-[100dvh] w-full flex flex-col bg-background">
                <TopHeader user={null} role="user" avatarUrl={null} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (maintenanceMode && role !== 'admin') {
        return <MaintenanceScreen />;
    }

    return (
        <RealtimeProvider>
            <div className="h-[100dvh] w-full bg-background flex flex-col overflow-hidden">
                <TopHeader user={user} role={role} avatarUrl={avatarUrl} />
                <div className="flex-1 w-full min-h-0 flex flex-col">
                    <main className="flex-1 w-full min-h-0 overflow-hidden">
                        <PageTransition>
                            {children}
                        </PageTransition>
                    </main>
                </div>
            </div>
        </RealtimeProvider>
    );
}
