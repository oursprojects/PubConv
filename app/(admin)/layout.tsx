"use client";

import * as React from "react";
import { TopHeader } from "@/components/layout/TopHeader";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = React.useState<any>(null);
    const [role, setRole] = React.useState('user');
    const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);
    const supabase = createClient();

    React.useEffect(() => {
        async function loadAdminData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role, avatar_url')
                        .eq('id', user.id)
                        .single();

                    setRole(profile?.role || 'user');
                    setAvatarUrl(profile?.avatar_url || null);
                }
            } catch (error) {
                console.error("Error loading admin layout data:", error);
            } finally {
                setLoading(false);
            }
        }
        loadAdminData();
    }, [supabase]);

    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-background flex flex-col">
            <TopHeader user={user} role={role} avatarUrl={avatarUrl} />
            <div className="flex-1 w-full flex flex-col">
                <main className="flex-1 w-full flex flex-col">
                    {children}
                </main>
            </div>
        </div>
    );
}
