"use client";

import { useChat, Message } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Info, Reply, X, Smile, RefreshCw, Copy, Check, CheckCheck, CircleDashed, ChevronDown, MessageSquare } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { motion, PanInfo, useAnimation, AnimatePresence } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

// --- Utility: Format Date Helper ---
const getDateLabel = (date: Date) => {
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (isToday) return "Today";

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return "Yesterday";

    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

// --- Component: Swipeable Message ---
const SwipeableMessage = ({
    children,
    onReply,
    isMe,
    isPending
}: {
    children: React.ReactNode,
    onReply: () => void,
    isMe: boolean,
    isPending?: boolean
}) => {
    const controls = useAnimation();
    const [dragX, setDragX] = useState(0);
    const isMobile = typeof window !== 'undefined' ? Capacitor.isNativePlatform() : false;

    const handleDragEnd = async (event: any, info: PanInfo) => {
        if (!isMobile) return;

        const threshold = 60;
        const isReplyAction = isMe ? info.offset.x < -threshold : info.offset.x > threshold;

        if (isReplyAction) {
            try {
                await Haptics.impact({ style: ImpactStyle.Medium });
            } catch (e) { }
            onReply();
        }

        controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
        setDragX(0);
    };

    return (
        <div className="relative w-full touch-pan-y">
            {/* Reply Icon: Only show on mobile */}
            {isMobile && (
                <div className={cn(
                    "absolute top-1/2 -translate-y-1/2 text-primary/70 z-0 flex items-center justify-center",
                    isMe ? "right-4" : "left-4"
                )}>
                    <Reply className="h-6 w-6 transition-all duration-200" style={{
                        opacity: Math.min(Math.abs(dragX) / 60, 1),
                        transform: `scale(${Math.min(Math.abs(dragX) / 60, 1.2)}) ${isMe ? 'scaleX(-1)' : ''} translateX(${isMe ? Math.max(dragX / 5, -10) : Math.min(dragX / 5, 10)}px)`
                    }} />
                </div>
            )}

            <motion.div
                drag={isMobile ? "x" : false}
                dragConstraints={isMe ? { left: -100, right: 0 } : { left: 0, right: 100 }}
                dragElastic={0.2}
                onDrag={isMobile ? (e, info) => setDragX(info.offset.x) : undefined}
                onDragEnd={isMobile ? handleDragEnd : undefined}
                animate={controls}
                className="relative z-10 w-full"
                whileTap={{ scale: 0.98 }}
            >
                {children}
            </motion.div>
        </div>
    );
};

export function ChatInterface() {
    const {
        messages,
        sendMessage,
        userId,
        messagesEndRef,
        role,
        onlineCount,
        activeUsers,
        connectionStatus,
        reconnect,
        toggleReaction,
        retryMessage,
        sendTypingEvent, // New prop
        typingUsers      // New prop
    } = useChat();

    const [inputValue, setInputValue] = useState("");
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [reactionPopoverId, setReactionPopoverId] = useState<string | null>(null);
    const [showScrollBottom, setShowScrollBottom] = useState(false);

    // Rate Limiting
    const [rateLimit, setRateLimit] = useState(0);
    const [cooldown, setCooldown] = useState(0);
    const supabase = createClient();
    const [messagesParent] = useAutoAnimate();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [searchResults, setSearchResults] = useState<{ username: string, avatar_url: string | null, role: string }[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Scroll detection
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
            setShowScrollBottom(!isNearBottom);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToBottomSmooth = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    };

    useEffect(() => {
        const fetchConfig = async () => {
            const { data } = await supabase.from('app_config').select('value').eq('key', 'message_rate_limit').single();
            if (data?.value !== undefined) setRateLimit(Number(data.value));
        };
        fetchConfig();
        const channel = supabase.channel('rate_limit_config', { config: { broadcast: { self: true } } })
            .on('broadcast', { event: 'rate_limit_change' }, (payload: { payload: { seconds: number } }) => {
                if (payload.payload?.seconds !== undefined) setRateLimit(payload.payload.seconds);
            }).subscribe();
        return () => { supabase.removeChannel(channel); };
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
        if (inputRef.current) inputRef.current.style.height = 'auto';
        if (rateLimit > 0) setCooldown(rateLimit);

        // Clear typing status immediately
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        sendTypingEvent(false);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    useEffect(() => {
        if (!mentionQuery) { setSearchResults([]); return; }
        const t = setTimeout(async () => {
            const { data } = await supabase.from('profiles').select('username, avatar_url, role').ilike('username', `${mentionQuery}%`).limit(5);
            if (data) setSearchResults(data);
        }, 300);
        return () => clearTimeout(t);
    }, [mentionQuery, supabase]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // Typing indicator logic
        if (newValue.trim().length > 0) {
            sendTypingEvent(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                sendTypingEvent(false);
            }, 3000); // Stop showing typing after 3s of inactivity
        } else {
            sendTypingEvent(false);
        }

        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
        const cursorPosition = e.target.selectionStart || 0;
        const textBeforeCursor = newValue.slice(0, cursorPosition);
        const lastWord = textBeforeCursor.split(/\s/).pop();
        if (lastWord && lastWord.startsWith('@')) {
            setMentionQuery(lastWord.slice(1));
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const handleMentionSelect = (selectedUsername: string) => {
        const lastAtIndex = inputValue.lastIndexOf('@');
        if (lastAtIndex !== -1) {
            setInputValue(inputValue.substring(0, lastAtIndex) + `@${selectedUsername} `);
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

    // Group messages by date helper
    const getMessageDateGroup = (msg: Message, prevMsg: Message | null) => {
        const date = new Date(msg.created_at);
        const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;

        if (!prevDate || date.getDate() !== prevDate.getDate() || date.getMonth() !== prevDate.getMonth() || date.getFullYear() !== prevDate.getFullYear()) {
            return getDateLabel(date);
        }
        return null;
    };

    return (
        <Card className="flex flex-col h-full bg-card border-border shadow-xl overflow-hidden rounded-3xl relative">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-start justify-between bg-background/80 backdrop-blur-sm z-30 w-full shrink-0 rounded-t-3xl pt-2">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                            <RefreshCw className="h-4 w-4 text-primary hidden" />{/* Dummy hidden to ensure import? No, reusing existing import */}
                            <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="font-semibold text-lg text-foreground">Global Chat Room</h2>
                        {role === 'admin' && <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">Admin</span>}
                    </div>
                    <div className="flex items-center gap-3 text-sm mt-0.5">
                        <div className="flex items-center gap-2 text-green-500">
                            <span className="flex h-2 w-2 rounded-full bg-green-500" />
                            <span>{onlineCount} online</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {connectionStatus === 'connected' && <span className="flex items-center gap-1 text-green-500 text-xs"><span className="flex h-1.5 w-1.5 rounded-full bg-green-500" />Connected</span>}
                            {connectionStatus === 'connecting' && <span className="flex items-center gap-1 text-yellow-500 text-xs"><RefreshCw className="h-3 w-3 animate-spin" />Connecting...</span>}
                            {connectionStatus === 'disconnected' && (
                                <span className="flex items-center gap-1 text-red-500 text-xs">
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-red-500" />Disconnected
                                    <Button variant="ghost" size="sm" className="h-5 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={reconnect}>Reconnect</Button>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <Popover>
                    <PopoverTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><Info className="h-5 w-5" /></Button></PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="end"><p className="text-xs">Note: Admins can clear chat history.</p></PopoverContent>
                </Popover>
            </div>

            {/* Messages Area */}
            <div ref={useCallback((node: HTMLDivElement | null) => { messagesParent(node); (scrollContainerRef as any).current = node; }, [messagesParent])} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-background container-scroll">
                <div className="flex justify-center mb-4"><div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border/50"><Info className="h-3 w-3 text-muted-foreground" /><p className="text-xs text-muted-foreground">Be respectful!</p></div></div>
                {messages.length === 0 && <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50"><p>No messages yet.</p></div>}

                {messages.map((msg, idx) => {
                    const dateGroup = getMessageDateGroup(msg, idx > 0 ? messages[idx - 1] : null);

                    return (
                        <div key={msg.id} className="w-full">
                            {/* Date Separator */}
                            {dateGroup && (
                                <div className="flex justify-center my-6">
                                    <span className="text-[10px] font-medium text-muted-foreground bg-muted/40 px-3 py-1 rounded-full border border-border/50 shadow-sm uppercase tracking-wide">
                                        {dateGroup}
                                    </span>
                                </div>
                            )}

                            <div className={cn("flex flex-col w-full group", msg.user_id === userId ? "items-end" : "items-start", msg.isPending && "opacity-70")}>
                                {/* Reply Context */}
                                {msg.reply_message && (
                                    <div className={cn("mb-1 text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/40 px-2.5 py-1.5 rounded-lg border-l-2 border-primary/50 max-w-[80%]", msg.user_id !== userId && "ml-10")}>
                                        <Reply className="h-3 w-3 shrink-0 opacity-60" />
                                        <div className="flex items-center gap-1 min-w-0">
                                            <span className="shrink-0 opacity-70">Replying to</span>
                                            <span className="font-semibold shrink-0">@{msg.reply_message.profiles.username}</span>
                                            <span className="truncate opacity-70 italic">&quot;{msg.reply_message.content}&quot;</span>
                                        </div>
                                    </div>
                                )}

                                <SwipeableMessage
                                    isMe={msg.user_id === userId}
                                    isPending={msg.isPending}
                                    onReply={() => setReplyingTo(msg)}
                                >
                                    <div className={cn("flex gap-2 items-start w-full relative", msg.user_id === userId ? "justify-end" : "justify-start")}>
                                        {msg.user_id !== userId && (
                                            <div className="shrink-0">
                                                <InitialsAvatar username={msg.profiles?.username || "?"} avatarUrl={msg.profiles?.avatar_url} size="md" isAdmin={msg.profiles?.role === 'admin'} />
                                            </div>
                                        )}

                                        <div className={cn("flex flex-col", msg.user_id === userId ? "items-end" : "items-start", "max-w-[80%]")}>
                                            <div className={cn("relative group/msg", msg.reactions && Object.keys(msg.reactions).length > 0 ? "mb-5" : "mb-1")}>

                                                {/* Actions Menu (Reply, React, Copy) - appear beside the bubble on hover */}
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
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 rounded-lg bg-background/80 border shadow-sm hover:bg-muted"
                                                        onClick={() => handleCopy(msg.content)}
                                                        title="Copy Text"
                                                    >
                                                        <Copy className="h-3 w-3 text-muted-foreground" />
                                                    </Button>

                                                    <Popover open={reactionPopoverId === msg.id} onOpenChange={(open) => setReactionPopoverId(open ? msg.id : null)}>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg bg-background/80 border shadow-sm hover:bg-muted">
                                                                <Smile className="h-3 w-3 text-muted-foreground" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-1.5 flex gap-1.5 rounded-full shadow-lg border-none bg-popover/95 backdrop-blur-md ring-1 ring-border" side="top" sideOffset={5}>
                                                            {['👍', '❤️', '😂', '😮', '😢', '🔥'].map((emoji, i) => (
                                                                <motion.button
                                                                    key={emoji}
                                                                    initial={{ opacity: 0, scale: 0, y: 10 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    transition={{ delay: i * 0.05 }}
                                                                    className="p-2 hover:bg-accent rounded-full text-2xl transition-transform hover:scale-125 active:scale-95"
                                                                    onClick={() => {
                                                                        try { Haptics.impact({ style: ImpactStyle.Light }); } catch (e) { }
                                                                        toggleReaction(msg.id, emoji);
                                                                        setReactionPopoverId(null);
                                                                    }}
                                                                >
                                                                    {emoji}
                                                                </motion.button>
                                                            ))}
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>

                                                {/* Bubble */}
                                                <div className={cn("px-3 py-1.5 text-sm rounded-2xl relative border shadow-sm z-10 transition-colors select-none", msg.user_id === userId ? "bg-primary text-primary-foreground border-primary/20" : "bg-muted/80 backdrop-blur-sm text-foreground border-border/50")}>
                                                    <p className={cn("whitespace-pre-wrap break-all leading-relaxed", msg.user_id === userId && "text-right")}>
                                                        {msg.content.split(/(@\w+)/g).map((part, idx) => {
                                                            if (part.startsWith('@')) {
                                                                const isActive = activeUsers.some(u => u.username === part.slice(1));
                                                                return <span key={idx} className={cn("font-bold", isActive ? "text-blue-500" : (msg.user_id === userId ? "text-primary-foreground/90" : "text-primary"))}>{part}</span>
                                                            }
                                                            return part;
                                                        })}
                                                    </p>
                                                    {/* Reactions */}
                                                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                        <div className={cn("absolute -bottom-4 flex items-center px-1.5 py-0.5 rounded-full border shadow-sm z-20 scale-90", Object.values(msg.reactions).some(ids => ids.includes(userId || '')) ? "bg-primary/10 border-primary/30" : "bg-background border-border", msg.user_id === userId ? "left-0" : "right-0")}>
                                                            <div className="flex items-center -space-x-1">
                                                                {Object.entries(msg.reactions).filter(([, ids]) => ids.length > 0).map(([emoji, ids], idx) => (
                                                                    <span key={emoji} className="text-sm select-none" style={{ zIndex: 10 - idx }}>{emoji}</span>
                                                                ))}
                                                            </div>
                                                            {Object.values(msg.reactions).flat().length > 1 && <span className="text-[9px] font-bold ml-1 opacity-70">{Object.values(msg.reactions).flat().length}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground/70 w-full px-1">
                                                <span className="font-medium">{msg.user_id === userId ? "You" : msg.profiles?.username}</span>
                                                <span>•</span>
                                                {msg.status === 'sending' ? <span className="italic flex items-center gap-1"><CircleDashed className="h-3 w-3 animate-spin" /> sending...</span> :
                                                    msg.status === 'failed' ? <div className="flex items-center gap-1 text-destructive font-medium"><span>Failed</span><button onClick={() => retryMessage && retryMessage(msg)} className="hover:underline flex items-center"><RefreshCw className="h-3 w-3 ml-0.5" /></button></div> :
                                                        <span className="flex items-center gap-1">
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {msg.user_id === userId && <CheckCheck className="h-3 w-3 text-primary/60 ml-0.5" />}
                                                        </span>}
                                            </div>
                                        </div>
                                    </div>
                                </SwipeableMessage>
                            </div>
                        </div>
                    );
                })}

                {/* Typing Indicator */}
                {typingUsers && typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 px-2 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex -space-x-2 mr-1">
                            {typingUsers.slice(0, 3).map((user, i) => (
                                <div key={user} className="h-6 w-6 rounded-full bg-muted border border-background flex items-center justify-center text-[10px] font-bold" style={{ zIndex: 3 - i }}>
                                    {user.charAt(0).toUpperCase()}
                                </div>
                            ))}
                        </div>
                        <div className="bg-muted/80 backdrop-blur-sm px-3 py-2 rounded-2xl rounded-bl-none flex items-center gap-1">
                            <span className="flex gap-1 h-3">
                                <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce delay-0" />
                                <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce delay-150" />
                                <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce delay-300" />
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-1">
                            {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} people are typing...`}
                        </span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to Bottom Button */}
            <AnimatePresence>
                {showScrollBottom && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute bottom-20 right-6 z-50"
                    >
                        <Button
                            size="icon"
                            className="rounded-full shadow-xl bg-primary/90 backdrop-blur hover:bg-primary text-primary-foreground h-10 w-10"
                            onClick={scrollToBottomSmooth}
                        >
                            <ChevronDown className="h-6 w-6" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-3 bg-background border-t border-border shrink-0 relative z-40 pb-[calc(env(safe-area-inset-bottom)+10px)]">
                {replyingTo && (
                    <div className="flex items-center justify-between bg-muted/60 backdrop-blur-md px-3 py-2 rounded-t-xl border-x border-t text-sm mb-2 animate-in slide-in-from-bottom-2 mx-1">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Reply className="h-4 w-4 text-primary shrink-0" />
                            <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-xs text-primary">Replying to @{replyingTo.profiles.username}</span>
                                <span className="text-muted-foreground truncate text-xs">{replyingTo.content}</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="h-6 w-6 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"><X className="h-4 w-4" /></Button>
                    </div>
                )}
                {showMentions && searchResults.length > 0 && (
                    <div className="absolute bottom-full left-4 mb-2 min-w-[200px] w-auto bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                        {searchResults.map(user => (
                            <button key={user.username} className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2" onClick={() => handleMentionSelect(user.username)}>
                                <InitialsAvatar username={user.username} avatarUrl={user.avatar_url} size="sm" isAdmin={user.role === 'admin'} />
                                <span>@{user.username}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex gap-2 relative items-end">
                    <div className="flex-1 relative">
                        <Textarea ref={inputRef} value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder={cooldown > 0 ? `Wait ${cooldown}s` : (replyingTo ? "Type your reply..." : "Type a message...")} className={cn("w-full bg-muted/50 border border-transparent focus:border-primary/20 focus:bg-background transition-all rounded-2xl shadow-none outline-none focus:ring-0 min-h-[44px] max-h-[120px] px-4 py-3 resize-none text-[15px]", replyingTo && "rounded-tl-sm rounded-tr-sm")} disabled={cooldown > 0} rows={1} />
                    </div>
                    <Button onClick={handleSend} disabled={!inputValue.trim() || cooldown > 0} size="icon" className={cn("h-11 w-11 rounded-xl shrink-0 shadow-sm transition-all active:scale-95 flex items-center justify-center", inputValue.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted")}>{cooldown > 0 ? <span className="text-xs font-bold">{cooldown}</span> : <Send className="h-5 w-5" />}</Button>
                </div>
            </div>
        </Card>
    );
}
