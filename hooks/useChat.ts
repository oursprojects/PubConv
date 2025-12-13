"use client";

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
}

type ProfileCache = Map<string, { username: string, avatar_url: string | null, role: string }>;

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [userId, setUserId] = useState<string | null>(null)
    const [role, setRole] = useState<string>('user')
    const [onlineCount, setOnlineCount] = useState(0)
    const [activeUsers, setActiveUsers] = useState<{ username: string, role: string, avatar_url: string | null }[]>([])
    const [username, setUsername] = useState<string | null>(null)

    const supabase = createClient()
    const router = useRouter()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const profileCache = useRef<ProfileCache>(new Map())

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, []);

    const handleUserRemoved = useCallback((reason: 'banned' | 'deleted') => {
        if (reason === 'banned') {
            router.push('/login?reason=banned');
        } else {
            router.push('/login?reason=deleted');
        }
    }, [router]);

    const fetchMessages = useCallback(async () => {
        const { data: initialMessages, error } = await supabase
            .from('messages')
            .select(`
                *,
                profiles(username, avatar_url, role),
                reply_message:messages!reply_to_id(
                    content,
                    user_id,
                    profiles(username)
                )
            `)
            .order('created_at', { ascending: true })
            .limit(50);

        if (error) {
            console.error('Error fetching messages:', error);
            return;
        }

        if (initialMessages) {
            initialMessages.forEach((msg: any) => {
                if (msg.profiles && msg.user_id) {
                    profileCache.current.set(msg.user_id, {
                        username: msg.profiles.username,
                        avatar_url: msg.profiles.avatar_url,
                        role: msg.profiles.role || 'user'
                    });
                }
            });
            // Supabase returns array or object for relations depending on 1:1 or 1:N.
            // With !reply_to_id it might be single object.
            const formattedMessages = initialMessages.map((msg: any) => ({
                ...msg,
                reply_message: Array.isArray(msg.reply_message) ? msg.reply_message[0] : msg.reply_message
            }));

            setMessages(formattedMessages as Message[]);
            scrollToBottom();
        }
    }, [supabase, scrollToBottom]);

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
                            return [...current, msg];
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
                        const trackId = currentUserId || ('anon-' + Math.random().toString(36).slice(2, 9));
                        await channel.track({
                            user_id: trackId,
                            username: currentUsername,
                            role: currentRole,
                            avatar_url: currentAvatar,
                            online_at: new Date().toISOString(),
                        });
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

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Send message with optimistic UI + broadcast
    const sendMessage = async (content: string, replyTo?: Message) => {
        if (!content.trim()) return;
        if (!userId) {
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
                avatar_url: '',
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

        setMessages(prev => [...prev, optimisticMessage]);
        scrollToBottom();

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
            console.error('Error sending message:', error);
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
                    avatar_url: '',
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

            setMessages(prev => prev.map(m =>
                m.id === tempId ? realMessage : m
            ));

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

    return {
        messages,
        sendMessage,
        userId,
        messagesEndRef,
        role,
        onlineCount,
        activeUsers,
        username,
        broadcastDelete,
        broadcastClearAll,
        broadcastMaintenanceMode,
        broadcastUserBanned,
        broadcastUserDeleted
    };
}
