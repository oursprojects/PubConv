"use client";

import { createClient } from '@/lib/supabase/client'
import { useCallback, useState, useEffect } from 'react'

export function useAdminBroadcast() {
    // createClient acts as a singleton getter now
    const supabase = createClient()
    const [isConnected, setIsConnected] = useState(false)
    const [chatChannel, setChatChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
    const [systemChannel, setSystemChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
    const [rateLimitChannel, setRateLimitChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)

    useEffect(() => {
        // Create channels for broadcasts
        const chat = supabase.channel('chat_room', {
            config: { broadcast: { self: true, ack: true } }
        })
        const system = supabase.channel('global_system', {
            config: { broadcast: { self: true, ack: true } }
        })
        const rateLimit = supabase.channel('rate_limit_config', {
            config: { broadcast: { self: true, ack: true } }
        })

        let chatReady = false
        let systemReady = false
        let rateLimitReady = false

        const checkAllReady = () => {
            if (chatReady && systemReady && rateLimitReady) {
                setIsConnected(true)
            }
        }

        const handleChatStatus = (status: string) => {
            console.log('Admin chat channel status:', status)
            if (status === 'SUBSCRIBED') {
                chatReady = true
                setChatChannel(chat)
                checkAllReady()
            }
        }

        const handleSystemStatus = (status: string) => {
            console.log('Admin system channel status:', status)
            if (status === 'SUBSCRIBED') {
                systemReady = true
                setSystemChannel(system)
                checkAllReady()
            }
        }

        const handleRateLimitStatus = (status: string) => {
            console.log('Admin rate limit channel status:', status)
            if (status === 'SUBSCRIBED') {
                rateLimitReady = true
                setRateLimitChannel(rateLimit)
                checkAllReady()
            }
        }

        chat.subscribe(handleChatStatus)
        system.subscribe(handleSystemStatus)
        rateLimit.subscribe(handleRateLimitStatus)

        return () => {
            console.log('Cleaning up admin channels')
            supabase.removeChannel(chat)
            supabase.removeChannel(system)
            supabase.removeChannel(rateLimit)
        }
    }, []) // Empty dependency array as `supabase` is now a singleton and shouldn't trigger re-runs

    const broadcastMaintenanceMode = useCallback(async (enabled: boolean) => {
        console.log('📤 Broadcasting maintenance_mode to both channels')

        // Broadcast to chat channel (for chat page)
        if (chatChannel) {
            await chatChannel.send({
                type: 'broadcast',
                event: 'maintenance_mode',
                payload: { enabled }
            })
        }

        // Broadcast to system channel (for all other pages)
        if (systemChannel) {
            await systemChannel.send({
                type: 'broadcast',
                event: 'maintenance_mode',
                payload: { enabled }
            })
        }

        console.log('📤 maintenance_mode broadcast sent:', enabled)
    }, [chatChannel, systemChannel])

    const broadcastRateLimit = useCallback(async (seconds: number) => {
        console.log('📤 Broadcasting rate_limit_change to rate limit channel')

        // Broadcast to rate limit channel (for chat page)
        if (rateLimitChannel) {
            await rateLimitChannel.send({
                type: 'broadcast',
                event: 'rate_limit_change',
                payload: { seconds }
            })
        }

        console.log('📤 rate_limit_change broadcast sent:', seconds)
    }, [rateLimitChannel])

    const broadcastUserBanned = useCallback(async (userId: string) => {
        console.log('📤 Broadcasting user_banned to both channels')

        if (chatChannel) {
            await chatChannel.send({
                type: 'broadcast',
                event: 'user_banned',
                payload: { userId }
            })
        }

        if (systemChannel) {
            await systemChannel.send({
                type: 'broadcast',
                event: 'user_banned',
                payload: { userId }
            })
        }

        console.log('📤 user_banned broadcast sent:', userId)
    }, [chatChannel, systemChannel])

    const broadcastUserDeleted = useCallback(async (userId: string) => {
        console.log('📤 Broadcasting user_deleted to both channels')

        if (chatChannel) {
            await chatChannel.send({
                type: 'broadcast',
                event: 'user_deleted',
                payload: { userId }
            })
        }

        if (systemChannel) {
            await systemChannel.send({
                type: 'broadcast',
                event: 'user_deleted',
                payload: { userId }
            })
        }

        console.log('📤 user_deleted broadcast sent:', userId)
    }, [chatChannel, systemChannel])

    return {
        broadcastMaintenanceMode,
        broadcastRateLimit,
        broadcastUserBanned,
        broadcastUserDeleted,
        isConnected
    }
}

