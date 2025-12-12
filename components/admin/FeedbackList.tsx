"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Trash2, Calendar, MessageCircle, AlertTriangle, Loader2, Bell } from "lucide-react";
import { deleteFeedback } from "@/app/(admin)/admin/actions";
import { createClient } from "@/lib/supabase/client";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface FeedbackItem {
    id: string;
    content: string;
    created_at: string;
    profiles?: {
        username?: string;
    };
}

export function FeedbackList({ initialFeedbacks }: { initialFeedbacks: FeedbackItem[] }) {
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(initialFeedbacks);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [newCount, setNewCount] = useState(0);
    const supabase = createClient();

    // Listen for real-time feedback broadcasts
    useEffect(() => {
        const channel = supabase.channel('admin_feedback', {
            config: { broadcast: { self: true } }
        });

        channel
            .on('broadcast', { event: 'new_feedback' }, (payload: {
                payload: { content: string; username: string; created_at: string }
            }) => {
                console.log('📩 New feedback received:', payload);
                const { content, username, created_at } = payload.payload;

                // Add new feedback to the top of the list
                const newFeedback: FeedbackItem = {
                    id: `temp-${Date.now()}`, // Temporary ID, will be replaced on refresh
                    content,
                    created_at,
                    profiles: { username }
                };

                setFeedbacks(prev => [newFeedback, ...prev]);
                setNewCount(prev => prev + 1);

                // Show toast notification
                toast.success('New Feedback!', {
                    description: `${username} just submitted feedback`,
                });
            })
            .subscribe((status: string) => {
                console.log('Admin feedback channel status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        const result = await deleteFeedback(id);
        if (result.success) {
            setFeedbacks(feedbacks.filter(f => f.id !== id));
        } else {
            console.error("Failed to delete feedback:", result.error);
            toast.error("Failed to delete feedback");
        }
        setDeletingId(null);
    };

    if (feedbacks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed text-sm">
                <MessageCircle className="h-10 w-10 mb-3 opacity-50" />
                <p>No feedback received yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {newCount > 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-400 text-sm">
                    <Bell className="h-4 w-4" />
                    <span>{newCount} new feedback{newCount > 1 ? 's' : ''} received!</span>
                    <button
                        onClick={() => setNewCount(0)}
                        className="ml-auto text-xs underline hover:no-underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {feedbacks.map((item) => (
                    <Card key={item.id} className={`flex flex-col h-full hover:shadow-md transition-shadow duration-200 ${item.id.startsWith('temp-') ? 'ring-2 ring-green-500/50' : ''}`}>
                        <CardHeader className="flex flex-row items-start gap-4 pb-3">
                            <Avatar className="h-10 w-10 border">
                                <AvatarFallback>{item.profiles?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-base font-semibold truncate leading-none mb-1.5">
                                    {item.profiles?.username || 'Unknown User'}
                                </CardTitle>
                                <CardDescription className="text-xs flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(item.created_at).toLocaleDateString()}
                                    <span className="text-muted-foreground/60">•</span>
                                    <span title={new Date(item.created_at).toLocaleString()}>
                                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 text-sm bg-muted/10 py-3 mx-4 rounded-md mb-2">
                            <p className="whitespace-pre-wrap break-words leading-relaxed text-foreground/90">
                                {item.content}
                            </p>
                        </CardContent>
                        <CardFooter className="pt-2 pb-4 flex justify-end border-t bg-muted/5">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <AnimatedButton variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2">
                                        {deletingId === item.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                            </>
                                        )}
                                    </AnimatedButton>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                            <AlertTriangle className="h-5 w-5" /> Delete Feedback
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete this feedback from <strong>{item.profiles?.username}</strong>?
                                            This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}

