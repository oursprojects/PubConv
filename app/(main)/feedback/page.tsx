"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Send, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { submitFeedback } from "./actions";

export default function FeedbackPage() {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [messageLength, setMessageLength] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        // Get current user's username for broadcast
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', user.id)
                    .single();
                if (profile) setUsername(profile.username);
            }
        };
        getUser();
    }, [supabase]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const subject = formData.get('subject') as string;
        const message = formData.get('message') as string;

        const result = await submitFeedback(formData);

        setLoading(false);

        if (result.success) {
            // Broadcast to admin
            const channel = supabase.channel('admin_feedback', {
                config: { broadcast: { self: false } }
            });

            await channel.subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                    await channel.send({
                        type: 'broadcast',
                        event: 'new_feedback',
                        payload: {
                            content: `${subject}: ${message}`,
                            username: username || 'Unknown',
                            created_at: new Date().toISOString()
                        }
                    });
                    console.log('📤 Feedback broadcast sent');
                    supabase.removeChannel(channel);
                }
            });

            setSubmitted(true);
        } else {
            setError(result.error || "Something went wrong.");
        }
    }

    if (submitted) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] px-4">
                <Card className="w-full max-w-sm text-center border-0 bg-muted/30 animate-in fade-in-0 zoom-in-95 duration-300">
                    <CardContent className="pt-8 pb-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
                        <p className="text-sm text-muted-foreground">
                            Your feedback has been received. We appreciate your input!
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto py-10 px-4">
            <Card className="border-0 bg-muted/30 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                <CardHeader>
                    <CardTitle className="text-2xl">Feedback</CardTitle>
                    <CardDescription>
                        Have suggestions or found a bug? Let us know!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                name="subject"
                                placeholder="What's this about?"
                                required
                                maxLength={50}
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="message">Message</Label>
                                <span className={`text-[10px] ${messageLength >= 180 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                    {messageLength}/200
                                </span>
                            </div>
                            <Textarea
                                id="message"
                                name="message"
                                placeholder="Tell us more..."
                                rows={5}
                                required
                                maxLength={200}
                                onChange={(e) => setMessageLength(e.target.value.length)}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive font-medium text-center">{error}</p>
                        )}

                        <Button type="submit" disabled={loading} className="w-full">

                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Feedback
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

