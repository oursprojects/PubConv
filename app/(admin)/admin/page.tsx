import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getUsers, getFeedbacks } from "./actions";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/UserManagement";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { FeedbackList } from "@/components/admin/FeedbackList";
import { SystemControls } from "@/components/admin/SystemControls";

export default async function AdminPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return redirect("/");
    }

    // Fetch data
    const { data: configs } = await supabase.from("app_config").select("*");
    console.log("[Admin] Raw configs:", configs);

    const maintenanceMode = configs?.find((c) => c.key === "maintenance_mode")?.value || false;
    const disableSignup = configs?.find((c) => c.key === "disable_signup")?.value || false;

    // Handle rate limit value - could be number, string, or nested object
    const rateLimitConfig = configs?.find((c) => c.key === "message_rate_limit");
    console.log("[Admin] Rate limit config:", rateLimitConfig);

    let rateLimit = 0;
    if (rateLimitConfig?.value !== undefined && rateLimitConfig?.value !== null) {
        // Handle different value formats
        const val = rateLimitConfig.value;
        if (typeof val === 'number') {
            rateLimit = val;
        } else if (typeof val === 'string') {
            rateLimit = parseInt(val, 10) || 0;
        } else if (typeof val === 'object' && val !== null) {
            // In case it's stored as an object like { value: 5 }
            rateLimit = Number(val) || 0;
        }
    }
    console.log("[Admin] Parsed rate limit:", rateLimit);

    const initialUsers = await getUsers();
    const feedbacks = await getFeedbacks();

    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <AdminTabs defaultTab="system">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="system">System Controls</TabsTrigger>
                    <TabsTrigger value="users">Manage Users</TabsTrigger>
                    <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
                </TabsList>

                <TabsContent value="system" className="space-y-6">
                    <SystemControls
                        initialMaintenanceMode={Boolean(maintenanceMode)}
                        initialDisableSignup={Boolean(disableSignup)}
                        initialRateLimit={Number(rateLimit)}
                    />
                </TabsContent>

                <TabsContent value="users">
                    {/* Fixed height to ensure scrolling happens properly inside */}
                    <Card className="h-[calc(100vh-220px)] flex flex-col">
                        <CardHeader className="shrink-0">
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>View, search, and moderate users.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0">
                            <UserManagement initialUsers={initialUsers} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="feedbacks">
                    <Card className="border-none shadow-none bg-transparent">
                        <CardHeader className="px-0">
                            <CardTitle>User Feedback</CardTitle>
                            <CardDescription>Read what users are saying.</CardDescription>
                        </CardHeader>
                        <CardContent className="px-0">
                            <FeedbackList initialFeedbacks={feedbacks} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </AdminTabs>
        </div>
    );
}
