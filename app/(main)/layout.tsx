"use client";

import { TopHeader } from "@/components/layout/TopHeader";
import { MaintenanceScreen } from "@/components/maintenance-screen";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";
import PageTransition from "@/components/page-transition";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState('user');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function loadData() {
            // Use getSession() instead of getUser() because getSession() works offline 
            // by checking the local storage token, whereas getUser() requires a server round-trip.
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (user) {
                setUser(user);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, avatar_url, is_banned')
                    .eq('id', user.id)
                    .single();

                if (profile?.is_banned) {
                    await supabase.auth.signOut();
                    router.push('/banned?reason=banned');
                    return;
                }

                setRole(profile?.role || 'user');
                setAvatarUrl(profile?.avatar_url);
            } else {
                // No user found, redirect to login
                // This ensures the app opens on Login instead of Home/Dashboard if not authenticated
                router.replace('/login');
                return; // Stop loading rest of data
            }

            // Check maintenance mode
            const { data: configs } = await supabase.from("app_config").select("*");
            const maintenance = configs?.find((c: any) => c.key === "maintenance_mode")?.value || false;
            setMaintenanceMode(maintenance);

            setLoading(false);
        }

        loadData();
    }, [supabase]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (maintenanceMode && role !== 'admin') {
        return <MaintenanceScreen />;
    }

    return (
        <RealtimeProvider>
            <div className="h-[100dvh] w-full bg-background flex flex-col overflow-hidden">
                {/* Header stays static - outside of PageTransition */}
                <TopHeader user={user} role={role} avatarUrl={avatarUrl} />
                <div className="flex-1 w-full min-h-0 flex flex-col">
                    <main className="flex-1 w-full min-h-0 overflow-hidden">
                        {/* Only page content animates */}
                        <PageTransition>
                            {children}
                        </PageTransition>
                    </main>
                </div>
            </div>
        </RealtimeProvider>
    );
}
