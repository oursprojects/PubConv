"use client";

import { useFormStatus } from "react-dom";
import { login } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" className="w-full rounded-xl" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                </>
            ) : (
                "Login"
            )}
        </Button>
    );
}

export function LoginForm() {
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setError(null);
        toast.loading("Logging in...");
        const res = await login(formData);
        toast.dismiss();
        // If we get here, login returned an error (success redirects server-side)
        if (res?.error) {
            setError(res.error);
            toast.error(res.error);
        }
    }

    return (
        <form action={handleSubmit} className="grid gap-2.5">
            <div className="grid gap-1">
                <Label htmlFor="username" className="text-xs">Username</Label>
                <Input
                    id="username"
                    name="username"
                    placeholder="Enter your username"
                    required
                    className="h-9"
                />
            </div>
            <div className="grid gap-1">
                <Label htmlFor="password" className="text-xs">Password</Label>
                <PasswordInput id="password" name="password" placeholder="Enter password" required className="h-9" />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex items-center space-x-2">
                <input type="checkbox" id="keep-logged-in" className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5" />
                <label htmlFor="keep-logged-in" className="text-[11px] text-muted-foreground">Keep me logged in</label>
            </div>
            <SubmitButton />
        </form>
    );
}

