"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { ModeToggle } from "@/components/mode-toggle";
import { InstallPWA } from "@/components/pwa-install-button";

export default function LoginPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background relative px-4">
            <div className="absolute top-3 right-3 flex items-center gap-2">
                <InstallPWA />
                <ModeToggle />
            </div>
            <Card className="w-full max-w-[340px] rounded-2xl shadow-xl bg-card/80 backdrop-blur-sm">
                <CardHeader className="space-y-1 text-center pb-2 pt-5 px-5">
                    <div className="flex justify-center mb-3">
                        <Image src="/logo.png" alt="PubConv Logo" width={56} height={56} className="rounded-xl" />
                    </div>
                    <CardTitle className="text-xl font-bold font-poppins">PubConv</CardTitle>
                    <CardDescription className="text-xs">Enter your username to login</CardDescription>
                </CardHeader>
                <CardContent>
                    {searchParams?.registered === 'true' && (
                        <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm font-medium text-center border border-green-200 dark:border-green-800">
                            Registration successful! Please login to your account.
                        </div>
                    )}
                    {searchParams?.reason === 'banned' && (
                        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm font-medium text-center border border-red-200 dark:border-red-800">
                            <strong>Account Banned</strong>
                            <p className="mt-1 text-xs">Your account has been banned by an administrator. Contact support if you believe this is an error.</p>
                        </div>
                    )}
                    {searchParams?.reason === 'deleted' && (
                        <div className="mb-4 p-3 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-sm font-medium text-center border border-orange-200 dark:border-orange-800">
                            <strong>Account Deleted</strong>
                            <p className="mt-1 text-xs">Your account has been deleted. You may register again with a new account.</p>
                        </div>
                    )}
                    <LoginForm />
                    <div className="mt-5 text-center text-[10px] text-muted-foreground font-roboto">
                        <p>Developed by <span className="italic">Mike Ryno Santiago</span></p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center pb-5 pt-0">
                    <div className="text-xs text-center">
                        Don't have an account?{" "}
                        <Link href="/register" className="underline font-medium">
                            Sign up
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
