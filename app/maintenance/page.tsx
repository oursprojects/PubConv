"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function MaintenancePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/chat';
    const supabase = createClient();

    useEffect(() => {
        // Check if maintenance is still enabled on initial load
        const checkMaintenance = async () => {
            const { data } = await supabase
                .from('app_config')
                .select('value')
                .eq('key', 'maintenance_mode')
                .single();

            const isMaintenanceActive = data?.value === true || data?.value === 'true';
            if (!isMaintenanceActive) {
                // Maintenance is not enabled, redirect back
                console.log('🔧 Maintenance not active, redirecting to:', returnTo);
                router.push(returnTo);
            }
        };
        checkMaintenance();

        // Listen for maintenance mode being disabled via broadcast
        const channel = supabase.channel('global_system', {
            config: {
                broadcast: { self: true }
            }
        });

        channel
            .on('broadcast', { event: 'maintenance_mode' }, (payload: any) => {
                console.log('🔧 Maintenance page received broadcast:', payload);
                // Handle both direct payload and nested payload structures
                const isEnabled = payload.payload?.enabled ?? payload.enabled;
                if (!isEnabled) {
                    // Maintenance disabled, redirect back to where user was
                    console.log('🔧 Maintenance disabled, redirecting to:', returnTo);
                    router.push(returnTo);
                }
            })
            .subscribe((status: string) => {
                console.log('Maintenance page channel status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, router, returnTo]);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
            setIsLoading(false);
        };
        checkAuth();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        router.push('/login');
    };

    const handleLogin = () => {
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="max-w-md w-[90%] md:w-full text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <Construction className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <CardTitle className="text-2xl">Under Maintenance</CardTitle>
                    <CardDescription>
                        We&apos;re currently performing scheduled maintenance.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Please check back in a few minutes. We apologize for any inconvenience.
                    </p>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                        <span>Maintenance in progress</span>
                    </div>
                    <p className="text-xs text-muted-foreground/60">
                        You&apos;ll be redirected automatically when maintenance ends.
                    </p>

                    {!isLoading && (
                        <div className="pt-4 border-t border-border mt-6">
                            {isAuthenticated ? (
                                <button
                                    onClick={handleLogout}
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                                >
                                    Log out
                                </button>
                            ) : (
                                <button
                                    onClick={handleLogin}
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                                >
                                    Log in
                                </button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
