import { TopHeader } from "@/components/layout/TopHeader";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let role = 'user';
    let avatarUrl: string | null = null;
    if (user) {
        const { data } = await supabase.from('profiles').select('role, avatar_url').eq('id', user.id).single();
        role = data?.role || 'user';
        avatarUrl = data?.avatar_url || null;
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
