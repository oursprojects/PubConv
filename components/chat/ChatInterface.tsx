"use client";

import { useChat, Message } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { useState, useRef, useEffect } from "react";
import { Send, Info, Reply, X, Smile, Trash2, RefreshCw } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { deleteMessage, clearAllMessages } from "@/app/(admin)/admin/actions";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { createClient } from "@/lib/supabase/client";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ChatInterface() {
    const {
        messages,
        sendMessage,
        userId,
        messagesEndRef,
        role,
        onlineCount,
        activeUsers,
        username,
        connectionStatus,
        reconnect,
        broadcastDelete,
        broadcastClearAll,
        toggleReaction
    } = useChat();

    const [inputValue, setInputValue] = useState("");
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    // Rate Limiting
    const [rateLimit, setRateLimit] = useState(0);
    const [cooldown, setCooldown] = useState(0);
    const supabase = createClient();
    const [messagesParent] = useAutoAnimate();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [searchResults, setSearchResults] = useState<{ username: string, avatar_url: string | null, role: string }[]>([]);

    useEffect(() => {
        const fetchConfig = async () => {
            const { data } = await supabase
                .from('app_config')
                .select('value')
                .eq('key', 'message_rate_limit')
                .single();

            if (data?.value !== undefined && data?.value !== null) {
                console.log("Fetched initial rate limit:", data.value);
                setRateLimit(Number(data.value));
            }
        };
        fetchConfig();

        // Subscribe to rate limit changes via broadcast (from admin)
        const channel = supabase
            .channel('rate_limit_config', {
                config: { broadcast: { self: true } }
            })
            .on('broadcast', { event: 'rate_limit_change' }, (payload: { payload: { seconds: number } }) => {
                console.log("Rate limit broadcast received:", payload);
                if (payload.payload?.seconds !== undefined) {
                    setRateLimit(payload.payload.seconds);
                }
            })
            .subscribe((status: string) => {
                console.log('Rate limit channel status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleSend = () => {
        if (!inputValue.trim() || cooldown > 0) return;

        sendMessage(inputValue, replyingTo || undefined);
        setInputValue("");
        setShowMentions(false);
        setReplyingTo(null);

        // Reset textarea height after sending
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }

        if (rateLimit > 0) {
            setCooldown(rateLimit);
        }
    };

    // Search users for mentions
    useEffect(() => {
        if (!mentionQuery) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            const { data } = await supabase
                .from('profiles')
                .select('username, avatar_url, role')
                .ilike('username', `${mentionQuery}%`)
                .limit(5);

            if (data) {
                setSearchResults(data);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [mentionQuery, supabase]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // Auto-resize
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;

        // Mention detection
        const cursorPosition = e.target.selectionStart || 0;
        const textBeforeCursor = newValue.slice(0, cursorPosition);
        const lastWord = textBeforeCursor.split(/\s/).pop();

        if (lastWord && lastWord.startsWith('@')) {
            const query = lastWord.slice(1);
            setMentionQuery(query);
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const handleMentionSelect = (selectedUsername: string) => {
        const lastAtIndex = inputValue.lastIndexOf('@');
        if (lastAtIndex !== -1) {
            const prefix = inputValue.substring(0, lastAtIndex);
            // Insert @username without brackets
            setInputValue(prefix + `@${selectedUsername} `);
            setShowMentions(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <>
            <Card className="flex flex-col h-full bg-card border-border shadow-xl overflow-hidden rounded-3xl">
                {/* Header ... (same) */}
                <div className="p-4 border-b border-border flex items-start justify-between bg-background/80 backdrop-blur-sm z-10 w-full shrink-0 rounded-t-3xl">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-lg text-foreground">Global Chat Room</h2>
                            {role === 'admin' && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                                    Admin
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-sm mt-0.5">
                            {/* Online Count */}
                            <div className="flex items-center gap-2 text-green-500">
                                <span className="flex h-2 w-2 rounded-full bg-green-500" />
                                <span>{onlineCount} online</span>
                            </div>
                            {/* Connection Status */}
                            <div className="flex items-center gap-1.5">
                                {connectionStatus === 'connected' && (
                                    <span className="flex items-center gap-1 text-green-500 text-xs">
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-green-500" />
                                        Connected
                                    </span>
                                )}
                                {connectionStatus === 'connecting' && (
                                    <span className="flex items-center gap-1 text-yellow-500 text-xs">
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                        Connecting...
                                    </span>
                                )}
                                {connectionStatus === 'disconnected' && (
                                    <span className="flex items-center gap-1 text-red-500 text-xs">
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-red-500" />
                                        Disconnected
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                            onClick={reconnect}
                                        >
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            Reconnect
                                        </Button>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {role === 'admin' && (
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 w-8 p-0 md:w-auto md:px-3 text-xs"
                                title="Clear All Messages"
                                onClick={() => setShowClearConfirm(true)}
                            >
                                <Trash2 className="h-4 w-4 md:mr-1" />
                                <span className="hidden md:inline">Clear Chat</span>
                            </Button>
                        )}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full">
                                    <span className="sr-only">Info</span>
                                    <Info className="h-5 w-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 bg-popover border-border text-popover-foreground p-3" align="end">
                                <p className="text-xs leading-relaxed">
                                    <span className="font-semibold block mb-1">Note:</span>
                                    Administrators have the ability to clear the chat history at any time.
                                </p>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    ref={messagesParent}
                    className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-background"
                >
                    {/* System Notice - Always visible at top */}
                    <div className="flex justify-center mb-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border/50">
                            <Info className="h-3 w-3 text-muted-foreground shrink-0" />
                            <p className="text-xs text-muted-foreground">
                                Be kind and respectful to everyone. Enjoy the conversation!
                            </p>
                        </div>
                    </div>

                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                            <p>No messages yet. Say hello!</p>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex w-full group gap-2",
                                msg.user_id === userId ? "justify-end" : "justify-start",
                                msg.isPending && "opacity-70"
                            )}
                        >
                            {msg.user_id !== userId && (
                                <InitialsAvatar
                                    username={msg.profiles?.username || "?"}
                                    avatarUrl={msg.profiles?.avatar_url}
                                    size="md"
                                    isAdmin={msg.profiles?.role === 'admin'}
                                />
                            )}

                            <div className={cn(
                                "flex flex-col",
                                msg.user_id === userId ? "items-end" : "items-start",
                                "max-w-[80%]"
                            )}>
                                {/* Reply Context - Shows what message THIS message is replying to */}
                                {msg.reply_message && (
                                    <div className={cn(
                                        "mb-1 text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/40 px-2.5 py-1.5 rounded-lg border-l-2 border-primary/50 max-w-full",
                                        msg.user_id === userId ? "ml-auto" : "mr-auto"
                                    )}>
                                        <Reply className="h-3 w-3 shrink-0 opacity-60" />
                                        <div className="flex items-center gap-1 min-w-0">
                                            <span className="shrink-0 opacity-70">Replying to</span>
                                            <span className="font-semibold shrink-0">@{msg.reply_message.profiles.username}</span>
                                            <span className="opacity-50 shrink-0">•</span>
                                            <span className="truncate opacity-70 italic">&quot;{msg.reply_message.content}&quot;</span>
                                        </div>
                                    </div>
                                )}

                                {/* Message Bubble with reactions - Messenger style */}
                                <div className="relative group/msg mb-4">
                                    {/* Reply & React buttons - appear beside the bubble on hover */}
                                    <div className={cn(
                                        "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity flex gap-0.5 z-20",
                                        msg.user_id === userId ? "right-full mr-1 flex-row-reverse" : "left-full ml-1"
                                    )}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-lg bg-background/80 border shadow-sm hover:bg-muted"
                                            onClick={() => setReplyingTo(msg)}
                                            title="Reply"
                                        >
                                            <Reply className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-lg bg-background/80 border shadow-sm hover:bg-muted"
                                                    title="Add Reaction"
                                                >
                                                    <Smile className="h-3 w-3 text-muted-foreground" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-1" align={msg.user_id === userId ? "end" : "start"}>
                                                <div className="flex gap-1">
                                                    {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            className="p-2 hover:bg-accent rounded text-lg transition-transform hover:scale-110"
                                                            onClick={() => toggleReaction(msg.id, emoji)}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Message Bubble */}
                                    <div className={cn(
                                        "px-3 py-1.5 text-sm rounded-2xl relative border-2 shadow-sm",
                                        msg.user_id === userId
                                            ? "bg-primary text-primary-foreground border-primary/30"
                                            : "bg-muted text-foreground border-border"
                                    )}>
                                        <p className={cn(
                                            "whitespace-pre-wrap break-all",
                                            msg.user_id === userId && "text-right"
                                        )}>
                                            {msg.content.split(/(@\w+)/g).map((part, index) => {
                                                if (part.startsWith('@')) {
                                                    const mentionedName = part.slice(1);
                                                    const activeUser = activeUsers.find(u => u.username === mentionedName);
                                                    const isAdmin = activeUser?.role === 'admin';

                                                    return (
                                                        <span
                                                            key={index}
                                                            className={cn(
                                                                "font-bold",
                                                                isAdmin
                                                                    ? (msg.user_id === userId ? "text-amber-200" : "text-amber-600")
                                                                    : (msg.user_id === userId ? "text-primary-foreground underline decoration-primary-foreground/30" : "text-primary")
                                                            )}
                                                        >
                                                            {part}
                                                        </span>
                                                    );
                                                }
                                                return part;
                                            })}
                                        </p>

                                        {/* Reactions Display - stacked emojis like Messenger */}
                                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (() => {
                                            const totalCount = Object.values(msg.reactions).reduce((sum, users) => sum + (users?.length || 0), 0);
                                            const hasUserReacted = Object.values(msg.reactions).some(users => userId && users?.includes(userId));
                                            const reactionEntries = Object.entries(msg.reactions).filter(([, users]) => users && users.length > 0);

                                            return (
                                                <div className={cn(
                                                    "absolute -bottom-5 flex items-center px-1 py-0.5 rounded-lg border shadow-sm z-10",
                                                    hasUserReacted
                                                        ? "bg-background border-primary/40"
                                                        : "bg-background border-border",
                                                    msg.user_id === userId ? "left-0" : "right-0"
                                                )}>
                                                    <div className="flex items-center">
                                                        {reactionEntries.map(([emoji, users], index) => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => toggleReaction(msg.id, emoji)}
                                                                className={cn(
                                                                    "text-[11px] hover:scale-110 transition-transform",
                                                                    index > 0 && "-ml-1"
                                                                )}
                                                                style={{ zIndex: reactionEntries.length - index }}
                                                                title={`${users.length} reaction${users.length > 1 ? 's' : ''}`}
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {totalCount >= 2 && (
                                                        <span className="text-[9px] text-muted-foreground font-medium ml-0.5">{totalCount}</span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Username • Date ... (same) */}
                                <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground">
                                    <span className="font-medium">
                                        {msg.user_id === userId ? "You" : msg.profiles?.username || "Unknown"}
                                    </span>
                                    <span>•</span>
                                    {msg.isPending ? (
                                        <span className="italic">Sending...</span>
                                    ) : (
                                        <span>
                                            {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Admin Actions - always on the right side */}
                            {role === 'admin' && (
                                <div className="flex flex-col justify-start self-start pt-1 px-1 shrink-0 order-last">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-transparent"
                                        onClick={() => setMessageToDelete(msg.id)}
                                        title="Delete message"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-background border-t border-border shrink-0 relative">
                    {/* Reply Banner ... (same) */}
                    {replyingTo && (
                        <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-t-lg border-x border-t text-sm mb-2 animate-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Reply className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="font-medium text-muted-foreground">Replying to</span>
                                <span className="font-bold truncate max-w-[150px]">@{replyingTo.profiles.username}</span>
                                <span className="text-muted-foreground truncate opacity-70 border-l pl-2 text-xs">{replyingTo.content}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setReplyingTo(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Mention Suggestions - using searchResults now */}
                    {showMentions && searchResults.length > 0 && (
                        <div className="absolute bottom-full left-4 mb-2 min-w-[200px] w-auto bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                            <div className="p-1 max-h-[200px] overflow-y-auto">
                                {searchResults.map(user => (
                                    <button
                                        key={user.username}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors flex items-center justify-between group gap-3"
                                        onClick={() => handleMentionSelect(user.username)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <InitialsAvatar
                                                username={user.username}
                                                avatarUrl={user.avatar_url}
                                                size="sm"
                                                isAdmin={user.role === 'admin'}
                                            />
                                            <span className="font-medium">@{user.username}</span>
                                        </div>
                                        {user.role === 'admin' && (
                                            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200 font-bold tracking-wide">
                                                ADMIN
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 relative items-end">
                        <div className="flex-1 relative">
                            <Textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={cooldown > 0 ? `Please wait ${cooldown}s...` : (replyingTo ? `Reply to ${replyingTo.profiles.username}...` : "Write a message...")}
                                className={cn(
                                    "w-full bg-transparent border border-border rounded-lg shadow-none outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground min-h-[44px] max-h-[150px] px-4 py-3 resize-none",
                                    replyingTo && "rounded-tl-none rounded-tr-none border-t-0"
                                )}
                                disabled={cooldown > 0}
                                maxLength={500}
                                rows={1}
                            />
                        </div>

                        <Button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || cooldown > 0}
                            size="icon"
                            className={cn(
                                "h-11 w-11 rounded-xl shrink-0 transition-all shadow-sm transform-gpu mb-[1px]",
                                (!inputValue.trim() || cooldown > 0)
                                    ? "bg-transparent text-muted-foreground opacity-50 cursor-not-allowed"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                        >
                            {cooldown > 0 ? (
                                <span className="text-xs font-bold">{cooldown}</span>
                            ) : (
                                <Send className="h-5 w-5 fill-current" />
                            )}
                            <span className="sr-only">Send</span>
                        </Button>
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 text-right mt-1">
                        {inputValue.length}/500
                    </div>
                </div>

            </Card >

            <div className="sr-only">
                {/* Hidden trigger for accessibility if needed */}
            </div>

            <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear Entire Chat?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete ALL messages for EVERYONE. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={async () => {
                                await clearAllMessages();
                                await broadcastClearAll();
                                setShowClearConfirm(false);
                            }}
                        >
                            Delete All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this message from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={async () => {
                                if (messageToDelete) {
                                    await deleteMessage(messageToDelete);
                                    await broadcastDelete(messageToDelete);
                                    setMessageToDelete(null);
                                }
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
