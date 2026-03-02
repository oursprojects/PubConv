"use client";

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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

    const supabase = createClient()
    const router = useRouter()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const profileCache = useRef<ProfileCache>(new Map())
    const previousMessageCountRef = useRef(0)

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

            setMessages(sortMessages(formattedMessages as Message[]));
            scrollToBottom();
        }
    }, [supabase, scrollToBottom, sortMessages]);

    // Initialize realtime connection
    useEffect(() => {
        let isMounted = true;
        let currentUsername = 'Guest';
        let currentRole = 'user';
        let currentAvatar: string | null = null;
        let currentUserId: string | null = null;

        const init = async () => {
            // 1. Get User
            const { data: { user } } = await supabase.auth.getUser();
            if (!isMounted) return;

            currentUserId = user?.id ?? null;
            setUserId(currentUserId);

            if (user) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('username, role, avatar_url, is_banned')
                    .eq('id', user.id)
                    .single();

                if (error && error.code === 'PGRST116') {
                    handleUserRemoved('deleted');
                    return;
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

                    profileCache.current.set(user.id, {
                        username: currentUsername,
                        avatar_url: currentAvatar,
                        role: currentRole
                    });
                }
            }

            // 2. Fetch Messages
            await fetchMessages();

            // 3. Create ONE channel for everything (presence + broadcast)
            const channel = supabase.channel('chat_room', {
                config: {
                    broadcast: { self: true }
                }
            });
            channelRef.current = channel;

            channel
                // BROADCAST for new messages (instant, client-to-client)
                .on('broadcast', { event: 'new_message' }, (payload: { payload: Message }) => {
                    console.log('📩 Broadcast message received:', payload);
                    const msg = payload.payload as Message;

                    if (isMounted && msg) {
                        setMessages((current) => {
                            // Skip if already exists or is own message
                            if (current.some(m => m.id === msg.id)) return current;
                            if (msg.user_id === currentUserId) return current;
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
                    console.log('🗑️ Broadcast delete received:', payload);
                    const msgId = payload.payload?.id;
                    if (isMounted && msgId) {
                        setMessages((current) => current.filter(m => m.id !== msgId));
                    }
                })
                // BROADCAST for clear all messages (admin action)
                .on('broadcast', { event: 'clear_all' }, (_payload: unknown) => {
                    console.log('🧹 Broadcast clear all received');
                    if (isMounted) {
                        setMessages([]);
                    }
                })
                // BROADCAST for maintenance mode toggle
                .on('broadcast', { event: 'maintenance_mode' }, (payload: { payload: { enabled: boolean } }) => {
                    console.log('🔧 Maintenance mode broadcast received:', payload);
                    console.log('🔧 Current role:', currentRole, 'isMounted:', isMounted);
                    console.log('🔧 Payload enabled:', payload.payload?.enabled);
                    if (isMounted && payload.payload?.enabled && currentRole !== 'admin') {
                        console.log('🔧 Redirecting to /maintenance...');
                        router.push('/maintenance?returnTo=%2Fchat');
                    } else {
                        console.log('🔧 Not redirecting - conditions not met');
                    }
                })
                // BROADCAST for user banned
                .on('broadcast', { event: 'user_banned' }, (payload: { payload: { userId: string } }) => {
                    console.log('🚫 User banned broadcast received:', payload);
                    if (isMounted && payload.payload?.userId === currentUserId) {
                        router.push('/banned?reason=banned');
                    }
                })
                // BROADCAST for user deleted
                .on('broadcast', { event: 'user_deleted' }, (payload: { payload: { userId: string } }) => {
                    console.log('❌ User deleted broadcast received:', payload);
                    if (isMounted && payload.payload?.userId === currentUserId) {
                        router.push('/banned?reason=deleted');
                    }
                })
                // BROADCAST for message generic updates (like reactions)
                .on('broadcast', { event: 'update_message' }, (payload: { payload: { id: string, reactions: Record<string, string[]> } }) => {
                    console.log('🔄 Message update broadcast:', payload);
                    if (isMounted && payload.payload) {
                        setMessages(current => current.map(msg =>
                            msg.id === payload.payload.id
                                ? { ...msg, reactions: payload.payload.reactions }
                                : msg
                        ));
                    }
                })
                // Presence for online users
                .on('presence', { event: 'sync' }, () => {
                    const newState = channel.presenceState();
                    const stateValues = Object.values(newState).flat() as { username?: string, role?: string, avatar_url?: string | null, user_id?: string }[];

                    const uniqueByUserId = new Map<string, typeof stateValues[0]>();
                    stateValues.forEach(u => {
                        if (u.user_id) {
                            uniqueByUserId.set(u.user_id, u);
                            profileCache.current.set(u.user_id, {
                                username: u.username || 'User',
                                avatar_url: u.avatar_url || null,
                                role: u.role || 'user'
                            });
                        }
                    });

                    const uniqueEntries = Array.from(uniqueByUserId.values());
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

                    if (isMounted) {
                        setOnlineCount(uniqueEntries.length);
                        setActiveUsers(uniqueUsers);
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
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [supabase, router, fetchMessages, scrollToBottom, handleUserRemoved]);

    // Auto-scroll only when a new message is appended, not on reaction updates.
    useEffect(() => {
        if (messages.length > previousMessageCountRef.current) {
            scrollToBottom();
        }
        previousMessageCountRef.current = messages.length;
    }, [messages.length, scrollToBottom]);

    // Send message with optimistic UI + broadcast
    const sendMessage = async (content: string, replyTo?: Message) => {
        if (!content.trim()) return;
        if (!userId) {
            if (!navigator.onLine) {
                toast.error("You're offline. Stay on this page and reconnect to continue.");
                return;
            }
            router.push('/login');
            return;
        }

        const tempId = 'temp-' + Date.now();
        const trimmedContent = content.trim();
        const now = new Date().toISOString();

        const optimisticMessage: Message = {
            id: tempId,
            content: trimmedContent,
            user_id: userId,
            created_at: now,
            profiles: {
                username: username || 'You',
                avatar_url: profileCache.current.get(userId)?.avatar_url || '',
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
            isPending: true
        };

        // Sort after adding to ensure correct chronological order
        setMessages(prev => {
            const updated = [...prev, optimisticMessage];
            return updated.sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
        });
        scrollToBottom();

        // Optimistic UI Haptics
        try {
            const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) { /* Fallback */ }

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
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error details:', error.details);
            setMessages(prev => prev.filter(m => m.id !== tempId));

            if (error.message.includes('banned')) {
                handleUserRemoved('banned');
            } else {
                alert('Failed to send message: ' + error.message);
            }
        } else if (data) {
            // Update local message with real ID
            const realMessage: Message = {
                id: data.id,
                content: trimmedContent,
                user_id: userId,
                created_at: data.created_at,
                profiles: {
                    username: username || 'You',
                    avatar_url: profileCache.current.get(userId)?.avatar_url || '',
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
                isPending: false
            };

            // Sort after updating to maintain chronological order
            setMessages(prev => {
                const updated = prev.map(m => m.id === tempId ? realMessage : m);
                return updated.sort((a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
            });

            // BROADCAST to other clients (instant!)
            if (channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'new_message',
                    payload: realMessage
                });
                console.log('📤 Broadcasted message:', realMessage);
            }
        }
    };

    // Delete message function (for admin)
    const broadcastDelete = async (messageId: string) => {
        // 1. Delete from database
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (error) {
            console.error('❌ Error deleting message from DB:', error);
            return;
        }

        // 2. Remove from local state immediately
        setMessages(current => current.filter(m => m.id !== messageId));

        // 3. Broadcast to other clients
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

        // 1. Delete ALL messages from the database
        // Uses gt so it applies to all rows (RLS admin-delete policy covers this)
        const { error } = await supabase
            .from('messages')
            .delete()
            .gt('created_at', '1970-01-01T00:00:00Z'); // matches all rows

        if (error) {
            console.error('❌ Error clearing messages from DB:', error);
            return;
        }

        // 2. Clear local state immediately
        setMessages([]);

        // 3. Broadcast to all connected clients
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'clear_all',
                payload: { timestamp: Date.now() }
            });
            console.log('📤 clear_all broadcast sent');
        }
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

    // Reaction Broadcast - REMOVED, using persistent DB + update broadcast
    // const [lastReaction, setLastReaction] = useState<{ emoji: string, sender: string, id: string } | null>(null);

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
                // We need to define a new broadcast event type for message updates 
                // because 'new_message' is for adds.
                // Actually this app handles 'new_message' by appending.
                // I'll add 'update_message' event.
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'update_message',
                    payload: { id: messageId, reactions: data }
                });
            }
        }
    };

    // Reconnect function - triggers re-initialization by forcing component remount
    const reconnect = useCallback(async () => {
        setConnectionStatus('connecting');
        if (channelRef.current) {
            await supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
        // Re-fetch messages and trigger re-subscription
        await fetchMessages();
        // Note: Full reconnection requires component remount or manual re-init
        // For now, just refresh the page as a simple solution
        window.location.reload();
    }, [supabase, fetchMessages]);

    return {
        messages,
        setMessages, // Export setMessages for update handler
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
        broadcastMaintenanceMode,
        broadcastUserBanned,
        broadcastUserDeleted,
        toggleReaction
    };
}
