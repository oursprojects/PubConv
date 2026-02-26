"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { updateSystemConfig } from "@/app/(main)/admin/actions";
import { useAdminBroadcast } from "@/hooks/useAdminBroadcast";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Loader2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SystemControlsProps {
    initialMaintenanceMode: boolean;
    initialDisableSignup: boolean;
    initialRateLimit: number;
}

export function SystemControls({ initialMaintenanceMode, initialDisableSignup, initialRateLimit }: SystemControlsProps) {
    const [maintenanceMode, setMaintenanceMode] = useState(initialMaintenanceMode);
    const [disableSignup, setDisableSignup] = useState(initialDisableSignup);
    const [rateLimit, setRateLimit] = useState(initialRateLimit);
    const [loading, setLoading] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState<{ type: string, value: boolean | number } | null>(null);

    const { broadcastMaintenanceMode, broadcastRateLimit, isConnected } = useAdminBroadcast();

    // Sync state when props change (e.g., when navigating back to page)
    useEffect(() => {
        setMaintenanceMode(initialMaintenanceMode);
        setDisableSignup(initialDisableSignup);
        setRateLimit(initialRateLimit);
    }, [initialMaintenanceMode, initialDisableSignup, initialRateLimit]);

    const handleToggle = async (type: string, newValue: boolean | number) => {
        setLoading(type);

        await updateSystemConfig(type, newValue);

        if (type === 'maintenance_mode') {
            setMaintenanceMode(newValue as boolean);
            await broadcastMaintenanceMode(newValue as boolean);
        } else if (type === 'disable_signup') {
            setDisableSignup(newValue as boolean);
        } else if (type === 'message_rate_limit') {
            setRateLimit(newValue as number);
            await broadcastRateLimit(newValue as number);
        }

        setLoading(null);
        setShowConfirm(null);
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="p-3 md:p-6 pb-1 md:pb-4">
                        <CardTitle className="text-base md:text-xl">Maintenance Mode</CardTitle>
                        <CardDescription className="text-xs md:text-sm">Lock the application for users.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 md:p-6 pt-0 md:pt-0 flex items-center justify-between">
                        <Label className="text-sm md:text-base">Enable Maintenance</Label>
                        <AnimatedButton
                            size="sm"
                            variant={maintenanceMode ? "destructive" : "outline"}
                            disabled={loading === 'maintenance_mode'}
                            onClick={() => setShowConfirm({ type: 'maintenance_mode', value: !maintenanceMode })}
                        >
                            {loading === 'maintenance_mode' && <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin mr-2" />}
                            {maintenanceMode ? "Enabled" : "Disabled"}
                        </AnimatedButton>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="p-3 md:p-6 pb-1 md:pb-4">
                        <CardTitle className="text-base md:text-xl">Registration</CardTitle>
                        <CardDescription className="text-xs md:text-sm">Control new user signups.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 md:p-6 pt-0 md:pt-0 flex items-center justify-between">
                        <Label className="text-sm md:text-base">Disable Signups</Label>
                        <AnimatedButton
                            size="sm"
                            variant={disableSignup ? "destructive" : "outline"}
                            disabled={loading === 'disable_signup'}
                            onClick={() => setShowConfirm({ type: 'disable_signup', value: !disableSignup })}
                        >
                            {loading === 'disable_signup' && <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin mr-2" />}
                            {disableSignup ? "Disabled" : "Allowed"}
                        </AnimatedButton>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="p-3 md:p-6 pb-1 md:pb-4">
                        <CardTitle className="text-base md:text-xl">Chat Rate Limit</CardTitle>
                        <CardDescription className="text-xs md:text-sm">Seconds between messages per user.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 md:p-6 pt-0 md:pt-0 flex items-center gap-4">
                        <div className="grid gap-2 w-full">
                            <Label htmlFor="rateLimit" className="text-sm md:text-base">Interval (Seconds)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="rateLimit"
                                    type="number"
                                    min="0"
                                    className="h-9 md:h-10"
                                    value={rateLimit}
                                    onChange={(e) => setRateLimit(Number(e.target.value))}
                                />
                                <AnimatedButton
                                    size="sm"
                                    onClick={() => handleToggle('message_rate_limit', rateLimit)}
                                    disabled={loading === 'message_rate_limit'}
                                >
                                    {loading === 'message_rate_limit' && <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin mr-2" />}
                                    Save
                                </AnimatedButton>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <AlertDialog open={!!showConfirm} onOpenChange={(open) => !open && setShowConfirm(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to change this setting?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => showConfirm && handleToggle(showConfirm.type, showConfirm.value)}
                            >
                                Confirm
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
