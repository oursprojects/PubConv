"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { loginClient } from "@/lib/auth-client";

export function LoginForm() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        toast.loading("Logging in...");
        const res = await loginClient(username, password);
        toast.dismiss();
        setLoading(false);

        if (res?.error) {
            setError(res.error);
            toast.error(res.error);
        } else if (res?.success) {
            toast.success("Welcome back!");
            router.push('/');
            router.refresh();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="grid gap-2.5">
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
            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                    </>
                ) : (
                    "Login"
                )}
            </Button>
        </form>
    );
}

