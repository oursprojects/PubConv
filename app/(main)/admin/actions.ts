import { createClient } from '@/lib/supabase/client'

async function checkAdmin() {
    const supabase = createClient()
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
    if (!await checkAdmin()) return { success: false, error: 'Unauthorized' }

    const supabase = createClient()
    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

    if (error) return { success: false, error: error.message }
    return { success: true }
}

export async function toggleBanUser(userId: string, isBanned: boolean) {
    if (!await checkAdmin()) return { success: false, error: 'Unauthorized' }

    // NOTE: Native ban via auth.admin is NOT possible from the client side without service role key.
    // This action will likely fail or only update the profile if RLS allows.
    // For a true ban, this should be moved to a Supabase Edge Function.

    // Update Public Profile (App Logic)
    const supabase = createClient()
    const { error } = await supabase
        .from('profiles')
        .update({ is_banned: isBanned })
        .eq('id', userId)

    if (error) return { success: false, error: error.message }

    return { success: true }
}

export async function getUsers(query?: string) {
    if (!await checkAdmin()) return []

    const supabase = createClient()
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
    const supabase = createClient()
    const { data } = await supabase
        .from('feedbacks')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })
    return data || []
}

export async function clearAllMessages() {
    if (!await checkAdmin()) return { success: false, error: 'Unauthorized' }

    const supabase = createClient()
    const { error } = await supabase
        .from('messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) return { success: false, error: error.message }
    return { success: true }
}

export async function deleteUser(userId: string) {
    if (!await checkAdmin()) return { success: false, error: 'Unauthorized' }

    // NOTE: Deleting auth user is NOT possible from the client side.
    return { success: false, error: 'Delete user not supported on mobile. Use the web dashboard.' }
}

export async function deleteFeedback(feedbackId: string) {
    if (!await checkAdmin()) return { success: false, error: 'Unauthorized' }

    try {
        const supabase = createClient()
        const { error } = await supabase
            .from('feedbacks')
            .delete()
            .eq('id', feedbackId)

        if (error) return { success: false, error: error.message }
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateSystemConfig(key: string, value: boolean | number | string) {
    if (!await checkAdmin()) return { success: false, error: 'Unauthorized' }

    const supabase = createClient()

    console.log(`[AdminConfig] Updating ${key} to:`, value, typeof value);

    const storeValue = key === 'message_rate_limit' ? Number(value) : value;

    const { data, error } = await supabase
        .from('app_config')
        .upsert({ key, value: storeValue }, { onConflict: 'key' })
        .select()

    if (error) {
        console.error(`[AdminConfig] Error:`, error.message);
        return { success: false, error: error.message }
    }

    return { success: true, data }
}
