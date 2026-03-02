"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, Ban, Scale, Mail } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background overflow-auto">
            <div className="max-w-lg mx-auto px-4 py-6">
                <div className="text-center mb-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                    <div className="inline-flex items-center justify-center p-2 rounded-xl bg-primary/10 mb-3">
                        <Scale className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-xl font-bold mb-1">Terms & Conditions</h1>
                    <p className="text-xs text-muted-foreground">Last updated: December 2025</p>
                </div>

                <div className="space-y-3">
                    {/* Age Requirement */}
                    <Card className="border border-border bg-muted/30 animate-in fade-in-0 slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                        <CardHeader className="pb-2 pt-3 px-4">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                Age Requirement
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground px-4 pb-3">
                            <p><strong className="text-foreground">You must be at least 18 years old</strong> to use PubConv. We may terminate accounts of users under 18.</p>
                        </CardContent>
                    </Card>

                    {/* Acceptable Use */}
                    <Card className="border border-border bg-muted/30 animate-in fade-in-0 slide-in-from-bottom-4 duration-500" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                        <CardHeader className="pb-2 pt-3 px-4">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Shield className="h-4 w-4 text-green-500" />
                                Acceptable Use
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground px-4 pb-3">
                            <ul className="list-disc list-inside space-y-0.5">
                                <li>Treat others with respect</li>
                                <li>Don't share others' personal info</li>
                                <li>Use for lawful purposes only</li>
                                <li>Don't hack or exploit the service</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Prohibited Content */}
                    <Card className="border border-border bg-muted/30 animate-in fade-in-0 slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                        <CardHeader className="pb-2 pt-3 px-4">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Ban className="h-4 w-4 text-red-500" />
                                Prohibited Content
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground px-4 pb-3">
                            <ul className="list-disc list-inside space-y-0.5">
                                <li>Hate speech, harassment, bullying</li>
                                <li>Explicit or adult content</li>
                                <li>Spam or advertising</li>
                                <li>Illegal content or activities</li>
                            </ul>
                            <p className="mt-1.5 text-amber-600 dark:text-amber-400">Violations may result in a permanent ban.</p>
                        </CardContent>
                    </Card>

                    {/* Privacy & Disclaimer */}
                    <Card className="border border-border bg-muted/30 animate-in fade-in-0 slide-in-from-bottom-4 duration-500" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
                        <CardHeader className="pb-2 pt-3 px-4">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Shield className="h-4 w-4 text-blue-500" />
                                Privacy & Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground px-4 pb-3">
                            <ul className="list-disc list-inside space-y-0.5">
                                <li>Messages are visible to all users</li>
                                <li>We store username and messages</li>
                                <li>We don't sell your data</li>
                                <li>You can request account deletion</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <div className="text-center text-xs text-muted-foreground pt-3 animate-in fade-in-0 duration-500" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                        <p className="mb-2">By using PubConv, you agree to these terms.</p>
                        <Link href="/" className="text-primary hover:underline">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

