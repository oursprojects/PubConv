"use client";

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { get, set } from 'idb-keyval'
import { Network } from '@capacitor/network'

export type Message = {
    id: string
    content: string
    user_id: string
    created_at: string
    profiles: {
        username: string
        avatar_url: string
        role?: string
    }
    reply_to_id?: string | null
    reply_message?: {
        content: string
        user_id: string
        profiles: {
            username: string
        }
    }
    isPending?: boolean
    status?: 'sending' | 'sent' | 'failed'
    reactions?: Record<string, string[]> | null
}

type ProfileCache = Map<string, { username: string, avatar_url: string | null, role: string }>;

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [userId, setUserId] = useState<string | null>(null)
    const [role, setRole] = useState<string>('user')
    const [onlineCount, setOnlineCount] = useState(0)
    const [activeUsers, setActiveUsers] = useState<{ username: string, role: string, avatar_url: string | null }[]>([])
    const [username, setUsername] = useState<string | null>(null)
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
    const [retryCount, setRetryCount] = useState(0)
    const [typingUsers, setTypingUsers] = useState<string[]>([]) // List of usernames typing

    const supabase = createClient()
    const router = useRouter()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const profileCache = useRef<ProfileCache>(new Map())
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, []);

    // Helper to sort messages by created_at to ensure correct order
    const sortMessages = useCallback((msgs: Message[]): Message[] => {
        return [...msgs].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    }, []);

    const handleUserRemoved = useCallback((reason: 'banned' | 'deleted') => {
        if (reason === 'banned') {
            router.push('/login?reason=banned');
        } else {
            router.push('/login?reason=deleted');
        }
    }, [router]);

    // Load from IDB on mount
    useEffect(() => {
        const loadCachedMessages = async () => {
            const cached = await get<Message[]>('chat_messages');
            if (cached) {
                setMessages(sortMessages(cached));
            }
        };
        loadCachedMessages();
    }, [sortMessages]);

    // Save to IDB whenever messages change (debounce slightly if needed, but here direct is okay for now)
    useEffect(() => {
        if (messages.length > 0) {
            set('chat_messages', messages);
        }
    }, [messages]);

    const fetchMessages = useCallback(async () => {
        // Fetch messages without the self-join (which returns wrong direction)
        const { data: initialMessages, error } = await supabase
            .from('messages')
            .select(`
                *,
                profiles(username, avatar_url, role)
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching messages:', error);
            // Don't clear messages on error, just keep cached ones
            return;
        }

        if (initialMessages) {
            // Reverse to display in chronological order (oldest first)
            const messagesInOrder = [...initialMessages].reverse();

            // Build a map of message id -> message for quick lookup
            const messageMap = new Map<string, typeof messagesInOrder[0]>();
            messagesInOrder.forEach((msg: any) => {
                messageMap.set(msg.id, msg);
                if (msg.profiles && msg.user_id) {
                    profileCache.current.set(msg.user_id, {
                        username: msg.profiles.username,
                        avatar_url: msg.profiles.avatar_url,
                        role: msg.profiles.role || 'user'
                    });
                }
            });

            // Build reply_message by looking up the parent message (the one this message is replying TO)
            const formattedMessages = messagesInOrder.map((msg: any) => {
                let reply_message = undefined;

                // If this message has reply_to_id, find the parent message it's replying to
                if (msg.reply_to_id) {
                    const parentMsg = messageMap.get(msg.reply_to_id);
                    if (parentMsg) {
                        reply_message = {
                            content: parentMsg.content,
                            user_id: parentMsg.user_id,
                            profiles: {
                                username: parentMsg.profiles?.username || 'Unknown'
                            }
                        };
                    }
                }

                return {
                    ...msg,
                    reply_message
                };
            });

            // Merge with local queue if needed, but for now just set
            setMessages(prev => {
                // Keep pending messages that are not yet in the fetched list
                const pending = prev.filter(m => m.isPending);
                const uniqueFormatted = formattedMessages.filter(m => !pending.some(p => p.id === m.id));
                return sortMessages([...uniqueFormatted, ...pending] as Message[]);
            });
            scrollToBottom();

            // If we successfully fetched messages, we have internet access. 
            // Set status to connected to verify connectivity even if socket is lagging.
            setConnectionStatus('connected');
        }
    }, [supabase, scrollToBottom, sortMessages]);

    // Send typing event (debounced on UI side, but here we just send)
    const sendTypingEvent = async (isTyping: boolean) => {
        if (channelRef.current && username) {
            await channelRef.current.track({
                user_id: userId,
                username: username,
                role: role,
                avatar_url: profileCache.current.get(userId!)?.avatar_url,
                online_at: new Date().toISOString(),
                is_typing: isTyping // Add typing status to presence
            });
        }
    };

    // Initialize realtime connection
    useEffect(() => {
        let isMounted = true;
        let currentUsername = 'Guest';
        let currentRole = 'user';
        let currentAvatar: string | null = null;
        let currentUserId: string | null = null;

        const init = async () => {
            // 1. Get User Session (works offline if cached)
            const { data: { session } } = await supabase.auth.getSession();
            if (!isMounted) return;

            if (session?.user) {
                currentUserId = session.user.id;
                setUserId(currentUserId);

                // Optimistically try to get profile from cache or IDB if needed, 
                // but for now we try to fetch if online. 
                // If offline, we might miss the username until reconnect.
                // TODO: Store profile in IDB too.

                const { data, error } = await supabase
                    .from('profiles')
                    .select('username, role, avatar_url, is_banned')
                    .eq('id', session.user.id)
                    .single();

                if (error && error.code === 'PGRST116') {
                    // Profile deleted?
                    // Only redirect if we are SURE it's not a network error. 
                    // PGRST116 is specific "no rows".
                    handleUserRemoved('deleted');
                    return;
                } else if (!data && !error) {
                    // Network error likely?
                }

                if (isMounted && data) {
                    if (data.is_banned) {
                        handleUserRemoved('banned');
                        return;
                    }
                    setRole(data.role || 'user');
                    currentUsername = data.username || 'User';
                    currentRole = data.role || 'user';
                    currentAvatar = data.avatar_url || null;
                    setUsername(currentUsername);

                    profileCache.current.set(session.user.id, {
                        username: currentUsername,
                        avatar_url: currentAvatar,
                        role: currentRole
                    });
                }
            } else {
                // No session found? Then we can redirect to login.
                // But wait, what if we are offline and session expired? 
                // getSession should return null if no token.
                // If offline, we might want to stay on the page but disabled?
                // For now, if no local session, we must login.
                // router.push('/login'); // Let the page component handle this check or leave it
            }

            // 2. Fetch Messages (will fail if offline, but that's handled)
            await fetchMessages();

            // 3. Create ONE channel for everything (presence + broadcast)
            const channel = supabase.channel('chat_room', {
                config: {
                    broadcast: { self: true },
                    presence: { key: currentUserId || 'anon' }
                }
            });
            channelRef.current = channel;

            channel
                // BROADCAST for new messages (instant, client-to-client)
                .on('broadcast', { event: 'new_message' }, (payload: { payload: Message }) => {
                    const msg = payload.payload as Message;

                    if (isMounted && msg) {
                        setMessages((current) => {
                            // Skip if already exists or is own message
                            if (current.some(m => m.id === msg.id && !m.isPending)) return current;
                            if (msg.user_id === currentUserId) return current; // We handle our own optimistically
                            // Sort after adding to ensure correct chronological order
                            const updated = [...current, msg];
                            return updated.sort((a, b) =>
                                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                            );
                        });
                        scrollToBottom();
                    }
                })
                // BROADCAST for deleted messages
                .on('broadcast', { event: 'delete_message' }, (payload: { payload: { id: string } }) => {
                    const msgId = payload.payload?.id;
                    if (isMounted && msgId) {
                        setMessages((current) => current.filter(m => m.id !== msgId));
                    }
                })
                // BROADCAST for clear all messages (admin action)
                .on('broadcast', { event: 'clear_all' }, (_payload: unknown) => {
                    if (isMounted) {
                        setMessages([]);
                    }
                })
                // BROADCAST for maintenance mode toggle
                .on('broadcast', { event: 'maintenance_mode' }, (payload: { payload: { enabled: boolean } }) => {
                    if (isMounted && payload.payload?.enabled && currentRole !== 'admin') {
                        router.push('/maintenance?returnTo=%2Fchat');
                    }
                })
                // BROADCAST for user banned
                .on('broadcast', { event: 'user_banned' }, (payload: { payload: { userId: string } }) => {
                    if (isMounted && payload.payload?.userId === currentUserId) {
                        router.push('/banned?reason=banned');
                    }
                })
                // BROADCAST for user deleted
                .on('broadcast', { event: 'user_deleted' }, (payload: { payload: { userId: string } }) => {
                    if (isMounted && payload.payload?.userId === currentUserId) {
                        router.push('/banned?reason=deleted');
                    }
                })
                // BROADCAST for message generic updates (like reactions)
                .on('broadcast', { event: 'update_message' }, (payload: { payload: { id: string, reactions: Record<string, string[]> } }) => {
                    if (isMounted && payload.payload) {
                        setMessages(current => current.map(msg =>
                            msg.id === payload.payload.id
                                ? { ...msg, reactions: payload.payload.reactions }
                                : msg
                        ));
                    }
                })
                // Presence for online users & typing status
                .on('presence', { event: 'sync' }, () => {
                    const newState = channel.presenceState();
                    const stateValues = Object.values(newState).flat() as {
                        username?: string,
                        role?: string,
                        avatar_url?: string | null,
                        user_id?: string,
                        is_typing?: boolean
                    }[];

                    const uniqueByUserId = new Map<string, typeof stateValues[0]>();
                    stateValues.forEach(u => {
                        if (u.user_id) {
                            // Prioritize the entry that says "is_typing: true" if multiple exist for same user?
                            // Presence usually syncs latest state. We just take whatever is there.
                            // If a user has multiple tabs, and one is typing, we consider them typing.
                            const existing = uniqueByUserId.get(u.user_id);
                            if (!existing || (!existing.is_typing && u.is_typing)) {
                                uniqueByUserId.set(u.user_id, u);
                            }

                            profileCache.current.set(u.user_id, {
                                username: u.username || 'User',
                                avatar_url: u.avatar_url || null,
                                role: u.role || 'user'
                            });
                        }
                    });

                    const uniqueEntries = Array.from(uniqueByUserId.values());

                    // Filter active users list
                    const users = uniqueEntries
                        .filter((u) => u.username && u.username !== 'Guest')
                        .map((u) => ({
                            username: u.username!,
                            role: u.role || 'user',
                            avatar_url: u.avatar_url || null
                        }));

                    const uniqueUsersMap = new Map<string, typeof users[0]>();
                    users.forEach(u => uniqueUsersMap.set(u.username, u));
                    const uniqueUsers = Array.from(uniqueUsersMap.values());

                    // Filter typing users (exclude self)
                    const typing = uniqueEntries
                        .filter(u => u.is_typing && u.user_id !== currentUserId && u.username)
                        .map(u => u.username!);

                    if (isMounted) {
                        setOnlineCount(uniqueEntries.length);
                        setActiveUsers(uniqueUsers);
                        setTypingUsers(typing);
                    }
                })
                .subscribe(async (status: string) => {
                    console.log('Chat room channel status:', status);
                    if (status === 'SUBSCRIBED') {
                        setConnectionStatus('connected');
                        const trackId = currentUserId || ('anon-' + Math.random().toString(36).slice(2, 9));
                        await channel.track({
                            user_id: trackId,
                            username: currentUsername,
                            role: currentRole,
                            avatar_url: currentAvatar,
                            online_at: new Date().toISOString(),
                            is_typing: false
                        });
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                        setConnectionStatus('disconnected');
                    } else {
                        setConnectionStatus('connecting');
                    }
                });
        };

        init();

        return () => {
            isMounted = false;
            // Clean up typing timeout
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [supabase, router, fetchMessages, scrollToBottom, handleUserRemoved, retryCount]);

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Reconnect function - triggers re-initialization by forcing component remount
    const reconnect = useCallback(async () => {
        setConnectionStatus('connecting');
        if (channelRef.current) {
            await supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
        // Force effect re-run by updating retryCount
        setRetryCount(prev => prev + 1);
    }, [supabase]);

    // Flush queue function
    const flushQueue = useCallback(async () => {
        const queue = await get<Message[]>('message_queue') || [];
        if (queue.length === 0) return;

        console.log('Flushing offline queue:', queue.length, 'messages');
        const queueCopy = [...queue];
        // Clear queue immediately to avoid double send (if failed, we re-add)
        await set('message_queue', []);

        for (const msg of queueCopy) {
            // Try sending
            // Haptic feedback for send action (light impact)
            try {
                // If it's a real call, we can call sendMessage? 
                // But sendMessage adds to state. We already have it in state?
                // Ideally, we just call the API.

                const { data, error } = await supabase
                    .from('messages')
                    .insert({
                        content: msg.content,
                        user_id: msg.user_id,
                        reply_to_id: msg.reply_to_id
                    })
                    .select('id, created_at')
                    .single();

                if (error) {
                    // Failed again, put back in queue?
                    console.error('Failed to flush message:', msg.id, error);
                    const currentQueue = await get<Message[]>('message_queue') || [];
                    await set('message_queue', [...currentQueue, msg]);

                    // Update UI to failed
                    setMessages(prev => prev.map(m =>
                        m.id === msg.id ? { ...m, status: 'failed' } : m
                    ));

                } else {
                    // Success!
                    // Update local message with real ID and sent status
                    const realMessage: Message = { ...msg, id: data.id, created_at: data.created_at, isPending: false, status: 'sent' };

                    setMessages(prev => {
                        const updated = prev.map(m => m.id === msg.id ? realMessage : m);
                        return sortMessages(updated);
                    });

                    // BROADCAST to other clients
                    if (channelRef.current) {
                        channelRef.current.send({
                            type: 'broadcast',
                            event: 'new_message',
                            payload: realMessage
                        });
                    }
                }

            } catch (e) {
                // Push back
                const currentQueue = await get<Message[]>('message_queue') || [];
                await set('message_queue', [...currentQueue, msg]);
            }
        }
    }, [supabase, channelRef, sortMessages]);

    // Network Listener for auto-flush
    useEffect(() => {
        let handle: any;
        const setupListener = async () => {
            // Initial check
            const status = await Network.getStatus();
            if (status.connected) flushQueue();

            handle = await Network.addListener('networkStatusChange', status => {
                if (status.connected) {
                    setConnectionStatus('connected');
                    flushQueue();
                    reconnect();
                } else {
                    setConnectionStatus('disconnected');
                }
            });
        };
        setupListener();
        return () => {
            if (handle) handle.remove();
        }
    }, [flushQueue, reconnect]);


    // Send message with optimistic UI + broadcast
    const sendMessage = async (content: string, replyTo?: Message) => {
        if (!content.trim()) return;

        // If no user check, assume guest or error, but don't redirect if just offline?
        // If we have userId, we are good.
        if (!userId) {
            // Verify if we really are logged out
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            // If we have session but userId state is null (race condition?), recover it
            setUserId(session.user.id);
        }

        const tempId = 'temp-' + Date.now();
        const trimmedContent = content.trim();
        const now = new Date().toISOString();

        const optimisticMessage: Message = {
            id: tempId,
            content: trimmedContent,
            user_id: userId!,
            created_at: now,
            profiles: {
                username: username || 'You',
                avatar_url: profileCache.current.get(userId!)?.avatar_url || '',
                role: role
            },
            reply_to_id: replyTo?.id,
            reply_message: replyTo ? {
                content: replyTo.content,
                user_id: replyTo.user_id,
                profiles: {
                    username: replyTo.profiles.username
                }
            } : undefined,
            isPending: true,
            status: 'sending'
        };

        // Sort after adding to ensure correct chronological order
        setMessages(prev => {
            const updated = [...prev, optimisticMessage];
            return sortMessages(updated);
        });
        scrollToBottom();

        // Stop typing status when sent
        sendTypingEvent(false);

        // Haptic feedback for send action (light impact)
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) {
            // Ignore haptic errors on web
        }

        // Check network status first
        const status = await Network.getStatus();

        if (!status.connected) {
            // OFFLINE MODE: Queue it
            const queue = await get<Message[]>('message_queue') || [];
            await set('message_queue', [...queue, optimisticMessage]);
            // Update UI to show it's queued/sending (already 'sending')
            return; // Done for now
        }

        // ONLINE: Try sending
        const { data, error } = await supabase
            .from('messages')
            .insert({
                content: trimmedContent,
                user_id: userId,
                reply_to_id: replyTo?.id
            })
            .select('id, created_at')
            .single();

        if (error) {
            console.error('❌ Error sending message:', error);

            // Error -> Add to Queue for retry or mark failed?
            // If it's a network error, queue it.
            // If it's permission/ban, fail it.
            if (error.message.includes('fetch') || error.message.includes('network')) {
                const queue = await get<Message[]>('message_queue') || [];
                await set('message_queue', [...queue, optimisticMessage]);
                // Keep status as 'sending' ideally? Or 'failed' with retry.
                // Let's keep 'sending' if we auto-queue.
            } else {
                // Mark as failed
                setMessages(prev => prev.map(m =>
                    m.id === tempId ? { ...m, isPending: false, status: 'failed' } : m
                ));
                try {
                    await Haptics.notification({ type: NotificationType.Error });
                } catch (e) { }

                if (error.message.includes('banned')) {
                    handleUserRemoved('banned');
                }
            }
        } else if (data) {
            // Update local message with real ID and sent status
            const realMessage: Message = { ...optimisticMessage, id: data.id, created_at: data.created_at, isPending: false, status: 'sent' };

            // Sort after updating to maintain chronological order
            setMessages(prev => {
                const updated = prev.map(m => m.id === tempId ? realMessage : m);
                return sortMessages(updated);
            });

            // BROADCAST to other clients
            if (channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'new_message',
                    payload: realMessage
                });
            }

            // If we successfully sent a message via REST, we are technically connected to the internet.
            // Force status to connected to stop the "Connecting..." spinner if it's stuck.
            setConnectionStatus('connected');
        }
    };

    // Delete message function (for admin)
    const broadcastDelete = async (messageId: string) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'delete_message',
                payload: { id: messageId }
            });
        }
    };

    // Clear all messages broadcast (for admin)
    const broadcastClearAll = async () => {
        console.log('📤 Broadcasting clear_all...');
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'clear_all',
                payload: { timestamp: Date.now() }
            });
            console.log('📤 clear_all broadcast sent');
        } else {
            console.log('❌ No channel ref available');
        }
        // Also clear local state
        setMessages([]);
    };

    // Broadcast maintenance mode (for admin)
    const broadcastMaintenanceMode = async (enabled: boolean) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'maintenance_mode',
                payload: { enabled }
            });
            console.log('📤 maintenance_mode broadcast sent:', enabled);
        }
    };

    // Broadcast user banned (for admin)
    const broadcastUserBanned = async (bannedUserId: string) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'user_banned',
                payload: { userId: bannedUserId }
            });
            console.log('📤 user_banned broadcast sent:', bannedUserId);
        }
    };

    // Broadcast user deleted (for admin)
    const broadcastUserDeleted = async (deletedUserId: string) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'user_deleted',
                payload: { userId: deletedUserId }
            });
            console.log('📤 user_deleted broadcast sent:', deletedUserId);
        }
    };

    const toggleReaction = async (messageId: string, emoji: string) => {
        if (!userId) return;

        // Optimistic Update - one reaction per user per message
        setMessages(current => current.map(msg => {
            if (msg.id !== messageId) return msg;

            const currentReactions = { ...msg.reactions };

            // First, remove user from ALL other emojis
            for (const key of Object.keys(currentReactions)) {
                if (key !== emoji && currentReactions[key]) {
                    currentReactions[key] = currentReactions[key].filter((id: string) => id !== userId);
                    if (currentReactions[key].length === 0) {
                        delete currentReactions[key];
                    }
                }
            }

            // Now toggle the selected emoji
            const userList = [...(currentReactions[emoji] || [])];
            const userIndex = userList.indexOf(userId);

            if (userIndex >= 0) {
                // User already has this reaction - remove it
                userList.splice(userIndex, 1);
            } else {
                // Add user to this reaction
                userList.push(userId);
            }

            if (userList.length === 0) {
                delete currentReactions[emoji];
            } else {
                currentReactions[emoji] = userList;
            }

            return { ...msg, reactions: currentReactions };
        }));

        const { data, error } = await supabase.rpc('toggle_message_reaction', {
            p_message_id: messageId,
            p_emoji: emoji
        });

        if (error) {
            console.error('Reaction error:', error);
            // Revert (could be complex, just re-fetch or ignore)
            fetchMessages();
        } else {
            // Broadcast the new state (data contains the new reactions jsonb)
            if (channelRef.current && data) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'update_message',
                    payload: { id: messageId, reactions: data }
                });
            }
        }
    };

    // Retry failed message
    const retryMessage = useCallback(async (msg: Message) => {
        // Remove failed message
        setMessages(current => current.filter(m => m.id !== msg.id));
        // Try sending again
        await sendMessage(msg.content, msg.reply_message ? { ...msg.reply_message, id: msg.reply_to_id!, created_at: '', profiles: msg.reply_message.profiles } as any : undefined);
    }, [sendMessage]);

    return {
        messages,
        setMessages, // Export setMessages for update handler
        sendMessage,
        retryMessage,
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
        broadcastMaintenanceMode,
        broadcastUserBanned,
        broadcastUserDeleted,
        toggleReaction,
        sendTypingEvent, // Export new function
        typingUsers      // Export new state
    };
}
