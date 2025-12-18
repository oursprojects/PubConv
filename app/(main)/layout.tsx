import { TopHeader } from "@/components/layout/TopHeader";
import { MaintenanceScreen } from "@/components/maintenance-screen";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";
import PageTransition from "@/components/page-transition";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let role = 'user';
    let avatarUrl = null;
    if (user) {
        const { data } = await supabase.from('profiles').select('role, avatar_url').eq('id', user.id).single();
        role = data?.role || 'user';
        avatarUrl = data?.avatar_url;
    }

    const { data: configs } = await supabase.from("app_config").select("*");
    const maintenanceMode = configs?.find((c: any) => c.key === "maintenance_mode")?.value || false;

    // Check if user is banned
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('is_banned').eq('id', user.id).single();
        if (profile?.is_banned) {
            // Force signout not directly possible in server component, but we can redirect to /banned
            // Ideally, we'd sign them out via an API route or middleware, but redirecting to /banned or /login handles the UX.
            // But since /banned has no auth middleware protection (it's public), it's fine.
            // However, we want them completely locked out.
            // Let's redirect to /login with error after signing out via a client component or just blocking here.

            // Actually, if we redirect to /banned, the RealtimeProvider (which *does* run on /banned?)
            // Wait, RealtimeProvider stops on /banned? No, it's NOT in the exclusion list!
            // checks exclusion: admin, maintenance, login, register.
            // So on /banned, RealtimeProvider runs. And it listens for 'user_banned' broadcast.
            // But on /banned page, we should also manually check status and signout?
            // For now, let's redirect to /banned page explicitly if they try to access main layout.
            redirect('/banned?reason=banned');
        }
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
