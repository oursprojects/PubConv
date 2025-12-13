"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ban } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";

export default function BannedPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reason = searchParams.get('reason') || 'banned';
    const [countdown, setCountdown] = useState(5);
    const supabase = createClient();

    useEffect(() => {
        // Force sign out when landing on banned page
        const signout = async () => {
            await supabase.auth.signOut();
        };
        signout();

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/login');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router, supabase]);

    const title = reason === 'deleted' ? 'Account Deleted' : 'Account Banned';
    const description = reason === 'deleted'
        ? 'Your account has been permanently deleted by an administrator.'
        : 'Your account has been banned by an administrator.';

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="max-w-md w-[90%] md:w-full text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <Ban className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-2xl text-destructive">{title}</CardTitle>
                    <CardDescription>
                        {description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-muted-foreground">
                        If you believe this is a mistake, please contact the administrator.
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Redirecting to login in</span>
                            <span className="font-bold text-lg text-destructive">{countdown}</span>
                            <span className="text-muted-foreground">seconds...</span>
                        </div>

                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-destructive h-full transition-all duration-1000 ease-linear"
                                style={{ width: `${(countdown / 5) * 100}%` }}
                            />
                        </div>

                        <button
                            onClick={() => router.push('/login')}
                            className="text-sm text-primary hover:underline hover:text-primary/80"
                        >
                            Go to Login immediately
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
