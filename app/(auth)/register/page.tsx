"use client";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { InstallPWA } from "@/components/pwa-install-button";
import { Ban, Construction, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function RegisterPage() {
    const [disableSignup, setDisableSignup] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function loadConfig() {
            const { data: configs } = await supabase.from("app_config").select("*");

            const disableSignupValue = configs?.find((c: any) => c.key === "disable_signup")?.value;
            setDisableSignup(disableSignupValue === true || disableSignupValue === "true");

            const maintenanceValue = configs?.find((c: any) => c.key === "maintenance_mode")?.value;
            setMaintenanceMode(maintenanceValue === true || maintenanceValue === "true");

            setLoading(false);
        }
        loadConfig();
    }, [supabase]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Show maintenance message if maintenance mode is active
    if (maintenanceMode) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <Card className="w-full max-w-sm p-6 rounded-3xl shadow-xl bg-card/80 backdrop-blur-sm text-center">
                    <CardHeader>
                        <div className="mx-auto bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-2xl mb-4">
                            <Construction className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <CardTitle className="text-2xl">Registration Unavailable</CardTitle>
                        <CardDescription>
                            System is currently under maintenance. Please try again later.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Return to Login
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Show disabled signup message
    if (disableSignup) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <Card className="w-full max-w-sm p-6 rounded-3xl shadow-xl bg-card/80 backdrop-blur-sm text-center">
                    <CardHeader>
                        <div className="mx-auto bg-muted p-4 rounded-2xl mb-4">
                            <Ban className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl">Registration Disabled</CardTitle>
                        <CardDescription>
                            New user signups are currently turned off by the administrator.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Return to Login
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background relative px-4 py-6">
            <div className="absolute top-[calc(0.75rem+env(safe-area-inset-top))] right-3 flex items-center gap-2">
                <InstallPWA />
                <ModeToggle />
            </div>
            <Card className="w-full max-w-[340px] rounded-3xl shadow-xl bg-card/60 backdrop-blur-xl border-border/50">
                <CardHeader className="space-y-1 text-center pb-2 pt-5 px-5">
                    <div className="flex justify-center mb-2">
                        <Image src="/logo.png" alt="PubConv Logo" width={40} height={40} className="rounded-xl" />
                    </div>
                    <CardTitle className="text-xl font-bold font-poppins">Register</CardTitle>
                    <CardDescription className="text-xs">Create your account</CardDescription>
                </CardHeader>
                <CardContent className="px-5 pb-3">
                    <RegisterForm />
                </CardContent>
                <CardFooter className="flex justify-center pb-5 pt-0">
                    <div className="text-xs text-center">
                        Already have an account?{" "}
                        <Link href="/login" className="underline font-medium">
                            Login
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
