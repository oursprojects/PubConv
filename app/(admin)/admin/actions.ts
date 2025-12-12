'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    return profile?.role === 'admin'
}

export async function deleteMessage(messageId: string) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }

    const supabase = await createClient()
    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

    if (error) return { error: error.message }
    revalidatePath('/')
    return { success: true }
}

export async function toggleBanUser(userId: string, isBanned: boolean) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }

    // 1. Update Auth User (Native Ban)
    // '876600h' is approx 100 years. 'none' removes the ban.
    try {
        const supabaseAdmin = createAdminClient()
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: isBanned ? '876600h' : 'none'
        })
        if (authError) {
            console.error('Failed to update auth user ban status:', authError)
            return { error: `Auth Error: ${authError.message}` }
        }
    } catch (e: any) {
        console.error('Admin client error:', e)
        return { error: `Server Error: ${e.message}` }
    }

    // 2. Update Public Profile (App Logic)
    const supabase = await createClient()
    const { error } = await supabase
        .from('profiles')
        .update({ is_banned: isBanned })
        .eq('id', userId)

    if (error) return { error: error.message }

    return { success: true }
}

export async function getUsers(query?: string) {
    if (!await checkAdmin()) return []

    const supabase = await createClient()
    let dbQuery = supabase
        .from('profiles')
        .select('*')
        .order('id', { ascending: false })

    if (query) {
        dbQuery = dbQuery.ilike('username', `%${query}%`)
    }

    const { data } = await dbQuery
    return data || []
}

export async function getFeedbacks() {
    if (!await checkAdmin()) return []
    const supabase = await createClient()
    const { data } = await supabase
        .from('feedbacks')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })
    return data || []
}

export async function clearAllMessages() {
    if (!await checkAdmin()) return { error: 'Unauthorized' }

    const supabase = await createClient()
    const { error } = await supabase
        .from('messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) return { error: error.message }
    revalidatePath('/')
    return { success: true }
}

export async function deleteUser(userId: string) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }

    try {
        const supabaseAdmin = createAdminClient()
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) return { error: error.message }
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function deleteFeedback(feedbackId: string) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }

    try {
        const supabaseAdmin = createAdminClient()
        const { error } = await supabaseAdmin
            .from('feedbacks')
            .delete()
            .eq('id', feedbackId)

        if (error) return { error: error.message }
        revalidatePath('/admin')
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function updateSystemConfig(key: string, value: boolean | number | string) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }

    const supabase = await createClient()

    console.log(`[AdminConfig] Updating ${key} to:`, value, typeof value);

    // For rate limit, ensure we store as a number
    const storeValue = key === 'message_rate_limit' ? Number(value) : value;
    console.log(`[AdminConfig] Store value:`, storeValue, typeof storeValue);

    const { data, error } = await supabase
        .from('app_config')
        .upsert({ key, value: storeValue }, { onConflict: 'key' })
        .select()

    console.log(`[AdminConfig] Upsert result - data:`, data, `error:`, error);

    if (error) {
        console.error(`[AdminConfig] Error:`, error.message);
        return { error: error.message }
    }

    revalidatePath('/admin')
    return { success: true, data }
}

