"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { signup } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useState, useRef, useMemo } from "react";
import { Recaptcha, RecaptchaRef } from "./Recaptcha";
import { WaveLoader } from "@/components/ui/wave-loader";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

function SubmitButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" className="w-full rounded-xl bg-foreground text-background hover:bg-foreground/90" disabled={pending || disabled}>
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

// Validation rule component
function ValidationRule({ valid, text }: { valid: boolean; text: string }) {
    return (
        <div className={`flex items-center gap-1.5 text-[10px] transition-colors ${valid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
            {valid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-50" />}
            <span>{text}</span>
        </div>
    );
}

// Password strength calculator
function getPasswordStrength(password: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
    if (password.length === 0) return { level: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { level: 2, label: 'Normal', color: 'bg-yellow-500' };
    return { level: 3, label: 'Strong', color: 'bg-green-500' };
}

// Password strength bar component
function PasswordStrengthBar({ password }: { password: string }) {
    const strength = getPasswordStrength(password);
    if (password.length === 0) return null;

    return (
        <div className="mt-1.5 space-y-1">
            <div className="flex gap-1">
                {[1, 2, 3].map((level) => (
                    <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${level <= strength.level ? strength.color : 'bg-muted'
                            }`}
                    />
                ))}
            </div>
            <p className={`text-[10px] transition-colors ${strength.level === 1 ? 'text-red-500' :
                strength.level === 2 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-green-600 dark:text-green-400'
                }`}>
                {strength.label}
            </p>
        </div>
    );
}

export function RegisterForm() {
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const recaptchaRef = useRef<RecaptchaRef>(null);
    const router = useRouter();

    // Live validation rules (all client-side, no API calls = free)
    const validation = useMemo(() => {
        const usernameRegex = /^[a-zA-Z0-9]{3,12}$/;
        return {
            usernameLength: username.length >= 3 && username.length <= 12,
            usernameFormat: /^[a-zA-Z0-9]*$/.test(username),
            usernameValid: usernameRegex.test(username),
            passwordLength: password.length >= 6 && password.length <= 50,
            passwordNotUsername: password.length > 0 && password.toLowerCase() !== username.toLowerCase(),
            passwordsMatch: password.length > 0 && password === confirmPassword,
        };
    }, [username, password, confirmPassword]);

    const allValid = validation.usernameValid && validation.passwordLength && validation.passwordNotUsername && validation.passwordsMatch;

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

        if (res?.success) {
            toast.success("Account created successfully!");
            if (res.session) {
                router.push("/");
            } else {
                router.push("/login?reason=registered");
            }
            return;
        }

        if (res?.error) {
            setError(res.error);
            toast.error(res.error);
            recaptchaRef.current?.reset();
        }
    }

    return (
        <form action={handleSubmit} className="grid gap-2.5">
            <div className="grid gap-1">
                <Label htmlFor="username" className="text-xs">Username</Label>
                <Input
                    id="username"
                    name="username"
                    placeholder="max123"
                    required
                    className="h-9"
                    maxLength={12}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                {username.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        <ValidationRule valid={validation.usernameLength} text="3-12 characters" />
                        <ValidationRule valid={validation.usernameFormat} text="Letters and numbers only" />
                    </div>
                )}
            </div>

            <div className="grid gap-1">
                <Label htmlFor="password" className="text-xs">Password</Label>
                <PasswordInput
                    id="password"
                    name="password"
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    maxLength={50}
                    className="h-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <PasswordStrengthBar password={password} />
                {password.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        <ValidationRule valid={validation.passwordNotUsername} text="Not same as username" />
                    </div>
                )}
            </div>

            <div className="grid gap-1">
                <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
                <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    required
                    minLength={6}
                    className="h-9"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {confirmPassword.length > 0 && (
                    <div className="mt-0.5">
                        <ValidationRule valid={validation.passwordsMatch} text="Passwords match" />
                    </div>
                )}
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
                    <Link href="/terms" className="text-primary hover:underline">
                        Terms
                    </Link>
                </label>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
            <SubmitButton disabled={!allValid} />
        </form>
    );
}

