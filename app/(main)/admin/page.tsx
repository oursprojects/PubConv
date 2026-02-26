"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/UserManagement";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { FeedbackList } from "@/components/admin/FeedbackList";
import { SystemControls } from "@/components/admin/SystemControls";
import { createClient } from "@/lib/supabase/client";

export default function AdminPage() {
    const [user, setUser] = React.useState<any>(null);
    const [profile, setProfile] = React.useState<any>(null);
    const [configs, setConfigs] = React.useState<any[]>([]);
    const [users, setUsers] = React.useState<any[]>([]);
    const [feedbacks, setFeedbacks] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const router = useRouter();
    const supabase = createClient();

    React.useEffect(() => {
        async function loadAdminData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login");
                    return;
                }
                setUser(user);

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                if (profile?.role !== "admin") {
                    router.push("/");
                    return;
                }
                setProfile(profile);

                // Fetch configs
                const { data: configsData } = await supabase.from("app_config").select("*");
                setConfigs(configsData || []);

                // Fetch users (direct call instead of actions.ts)
                const { data: usersData } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('id', { ascending: false });
                setUsers(usersData || []);

                // Fetch feedbacks (direct call instead of actions.ts)
                const { data: feedbacksData } = await supabase
                    .from('feedbacks')
                    .select('*, profiles(username)')
                    .order('created_at', { ascending: false });
                setFeedbacks(feedbacksData || []);

            } catch (error) {
                console.error("Error loading admin data:", error);
            } finally {
                setLoading(false);
            }
        }
        loadAdminData();
    }, [supabase, router]);

    if (loading) {
        return (
            <div className="container mx-auto p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const maintenanceMode_raw = configs?.find((c) => c.key === "maintenance_mode")?.value;
    const maintenanceMode = maintenanceMode_raw === true || maintenanceMode_raw === 'true';
    const disableSignup_raw = configs?.find((c) => c.key === "disable_signup")?.value;
    const disableSignup = disableSignup_raw === true || disableSignup_raw === 'true';

    const rateLimitConfig = configs?.find((c) => c.key === "message_rate_limit");
    let rateLimit = 0;
    if (rateLimitConfig?.value !== undefined && rateLimitConfig?.value !== null) {
        const val = rateLimitConfig.value;
        if (typeof val === 'number') {
            rateLimit = val;
        } else if (typeof val === 'string') {
            rateLimit = parseInt(val, 10) || 0;
        } else if (typeof val === 'object' && val !== null) {
            rateLimit = Number(val) || 0;
        }
    }

    return (
        <div className="container mx-auto p-4 md:py-8 flex flex-col gap-6 max-w-5xl">
            <h1 className="text-2xl md:text-3xl font-bold shrink-0">Admin Dashboard</h1>

            <AdminTabs defaultTab="system">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="system">System Controls</TabsTrigger>
                    <TabsTrigger value="users">Manage Users</TabsTrigger>
                    <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
                </TabsList>

                <TabsContent value="system">
                    <SystemControls
                        initialMaintenanceMode={Boolean(maintenanceMode)}
                        initialDisableSignup={Boolean(disableSignup)}
                        initialRateLimit={Number(rateLimit)}
                    />
                </TabsContent>

                <TabsContent value="users" className="h-[600px] md:h-[80vh]">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="shrink-0 p-4 md:p-6 pb-2">
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>View, search, and moderate users.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0 min-h-0">
                            <div className="h-full w-full">
                                <UserManagement initialUsers={users} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="feedbacks" className="h-[600px] md:h-[80vh]">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="shrink-0 p-4 md:p-6 pb-2">
                            <CardTitle>User Feedback</CardTitle>
                            <CardDescription>Read what users are saying.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-4 md:p-6 min-h-0">
                            <FeedbackList initialFeedbacks={feedbacks} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </AdminTabs>
        </div>
    );
}
