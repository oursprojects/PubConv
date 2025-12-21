"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { UserCog, Shield, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function loadProfile() {
            // Use getSession for offline support
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user) {
                // Only redirect if definitely no session
                router.push("/login");
                return;
            }

            setUser(user);

            // Optimistically try to fetch profile, but don't fail if offline
            const { data: profileData, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
            } else if (error) {
                console.log("Could not load profile data (possibly offline):", error);
                // Keep the page loading with limited data (just user object)
            }

            setLoading(false);
        }
        loadProfile();
    }, [supabase, router]);

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-background min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-lg mx-auto px-4 py-4 md:py-8">

            <Tabs defaultValue="profile" className="w-full animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="profile" className="gap-2">
                        <UserCog className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <Card className="overflow-hidden">
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Manage your public profile and account details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProfileForm profile={profile || {}} user={user} />
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t bg-muted/50 p-6">
                            <div className="text-sm text-muted-foreground">
                                Signed in as <span className="font-medium text-foreground">{user.email}</span>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>
                                Update your password and manage account security.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChangePasswordForm />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

