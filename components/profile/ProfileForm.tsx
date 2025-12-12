"use client";

import { useFormStatus } from "react-dom";
import { updateProfile } from "@/app/(main)/profile/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

import { AnimatedButton } from "@/components/ui/animated-button";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <AnimatedButton type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Saving..." : "Save Changes"}
        </AnimatedButton>
    );
}

export function ProfileForm({ profile }: { profile: any }) {
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    async function handleSubmit(formData: FormData) {
        setMessage(null);
        const res = await updateProfile(formData);
        if (res?.error) {
            setMessage({ type: 'error', text: res.error });
        } else if (res?.success) {
            setMessage({ type: 'success', text: "Profile updated successfully!" });
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                        {profile?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold">{profile?.username}</h2>
                    <p className="text-muted-foreground text-sm">Update your personal details below.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        value={profile?.username || ""}
                        disabled
                        readOnly
                        className="bg-muted"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                        id="bio"
                        name="bio"
                        defaultValue={profile?.bio || ""}
                        placeholder="Tell us about yourself..."
                    />
                </div>
            </div>

            {message && (
                <p className={message.type === 'error' ? "text-red-500 text-sm" : "text-green-500 text-sm"}>
                    {message.text}
                </p>
            )}

            <SubmitButton />
        </form>
    );
}
