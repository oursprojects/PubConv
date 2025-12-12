"use client";

import { useFormStatus } from "react-dom";
import { signup } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { Recaptcha, RecaptchaRef } from "./Recaptcha";
import { WaveLoader } from "@/components/ui/wave-loader";
import { toast } from "sonner";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" className="w-full rounded-xl bg-foreground text-background hover:bg-foreground/90" disabled={pending}>
            {pending ? (
                <>
                    <WaveLoader className="mr-2 h-3" />
                    Creating account...
                </>
            ) : (
                "Register"
            )}
        </Button>
    );
}

export function RegisterForm() {
    const [error, setError] = useState<string | null>(null);
    const recaptchaRef = useRef<RecaptchaRef>(null);

    async function handleSubmit(formData: FormData) {
        setError(null);

        // Get reCAPTCHA token
        const recaptchaToken = recaptchaRef.current?.getValue();
        if (!recaptchaToken) {
            setError("Please complete the reCAPTCHA verification.");
            toast.error("Please complete the reCAPTCHA verification.");
            return;
        }

        // Append token to form data
        formData.append("recaptchaToken", recaptchaToken);

        toast.loading("Creating account...");
        const res = await signup(formData);
        toast.dismiss();
        if (res?.error) {
            setError(res.error);
            toast.error(res.error);
            recaptchaRef.current?.reset();
        } else {
            toast.success("Account created! Please log in.");
        }
    }

    return (
        <form action={handleSubmit} className="grid gap-2.5">
            <div className="grid gap-1">
                <Label htmlFor="username" className="text-xs">Username</Label>
                <Input id="username" name="username" placeholder="max123" required className="h-9" />
            </div>

            <div className="grid gap-1">
                <Label htmlFor="password" className="text-xs">Password</Label>
                <PasswordInput id="password" name="password" placeholder="Min 6 characters" required minLength={6} className="h-9" />
            </div>

            <div className="grid gap-1">
                <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
                <PasswordInput id="confirmPassword" name="confirmPassword" placeholder="Confirm password" required minLength={6} className="h-9" />
            </div>

            <div className="transform scale-90 origin-left -my-1">
                <Recaptcha ref={recaptchaRef} />
            </div>

            <div className="flex items-start space-x-2">
                <input
                    type="checkbox"
                    id="terms"
                    name="terms"
                    required
                    className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5 mt-0.5"
                />
                <label htmlFor="terms" className="text-[11px] text-muted-foreground leading-tight">
                    I am 18+ and agree to the{" "}
                    <a href="/terms" target="_blank" className="text-primary hover:underline">
                        Terms
                    </a>
                </label>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
            <SubmitButton />
        </form>
    );
}

