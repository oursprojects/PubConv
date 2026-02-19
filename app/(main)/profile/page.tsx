import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { UserCog, Shield } from "lucide-react";

export default async function ProfilePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

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
                            <ProfileForm profile={profile} />
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

