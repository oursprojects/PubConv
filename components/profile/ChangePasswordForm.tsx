"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { WaveLoader } from "@/components/ui/wave-loader";
import { toast } from "sonner";
import { updatePasswordClient } from "@/lib/auth-client";

export function ChangePasswordForm() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const newPassword = formData.get("newPassword") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            setLoading(false);
            return;
        }

        const res = await updatePasswordClient(newPassword, confirmPassword);
        setLoading(false);

        if (res?.error) {
            toast.error(res.error);
            setError(res.error);
        } else {
            formRef.current?.reset();
            toast.success("Password updated successfully!");
        }
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                    id="newPassword"
                    name="newPassword"
                    placeholder="Enter your new password"
                    required
                    minLength={6}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm your new password"
                    required
                    minLength={6}
                />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                    <>
                        <WaveLoader className="mr-2 h-3" />
                        Updating...
                    </>
                ) : (
                    "Update Password"
                )}
            </Button>
        </form>
    );
}
