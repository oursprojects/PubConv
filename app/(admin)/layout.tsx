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
    if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        role = data?.role || 'user';
    }

    return (
        <div className="min-h-screen w-full bg-background flex flex-col">
            <TopHeader user={user} role={role} />
            <div className="flex-1 w-full flex flex-col">
                <main className="flex-1 w-full flex flex-col">
                    {children}
                </main>
            </div>
        </div>
    );
}
