"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { updateSystemConfig } from "@/app/(main)/admin/actions";
import { useAdminBroadcast } from "@/hooks/useAdminBroadcast";
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
import { Lock, Unlock, UserPlus, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

export function SwitchWrapper({ configKey, initialValue }: { configKey: string, initialValue: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [checked, setChecked] = useState(initialValue);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingChecked, setPendingChecked] = useState(initialValue);
    const { broadcastMaintenanceMode } = useAdminBroadcast();

    const isMaintenance = configKey === "maintenance_mode";
    const label = isMaintenance ? "Maintenance Mode" : "Signups";
    const action = pendingChecked ? "ENABLE" : "DISABLE";

    // Dynamic icons and colors based on state
    const ActiveIcon = isMaintenance ? Lock : Ban;
    const InactiveIcon = isMaintenance ? Unlock : UserPlus;

    return (
        <>
            <div className="flex items-center gap-3">
                <div className={cn(
                    "transition-all duration-500 ease-in-out px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5",
                    checked
                        ? (isMaintenance ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400")
                        : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                )}>
                    {checked ? (
                        <>
                            <ActiveIcon className="h-3 w-3 animate-in zoom-in duration-300" />
                            <span className="animate-in fade-in duration-300">{isMaintenance ? "Active" : "Disabled"}</span>
                        </>
                    ) : (
                        <>
                            <InactiveIcon className="h-3 w-3 animate-in zoom-in duration-300" />
                            <span className="animate-in fade-in duration-300">{isMaintenance ? "Inactive" : "Allowed"}</span>
                        </>
                    )}
                </div>

                <Switch
                    checked={checked}
                    disabled={isPending}
                    onCheckedChange={(val) => {
                        setPendingChecked(val);
                        setShowConfirm(true);
                    }}
                    className={cn(
                        "transition-all duration-300",
                        checked ? "data-[state=checked]:bg-destructive" : ""
                    )}
                />
            </div>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Do you really want to {action} {label}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className={cn(pendingChecked ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "")}
                            onClick={() => {
                                setChecked(pendingChecked);
                                startTransition(async () => {
                                    await updateSystemConfig(configKey, pendingChecked);
                                    // Broadcast maintenance mode change
                                    if (isMaintenance) {
                                        await broadcastMaintenanceMode(pendingChecked);
                                    }
                                });
                                setShowConfirm(false);
                            }}
                        >
                            Confirm Change
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
