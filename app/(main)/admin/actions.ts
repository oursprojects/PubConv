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
    const { error } = await supabase.rpc('admin_delete_message', { target_message_id: messageId })

    if (error) return { success: false, error: error.message }
    return { success: true }
}

export async function toggleBanUser(userId: string, isBanned: boolean) {
    if (!await checkAdmin()) return { success: false, error: 'Unauthorized' }

    const supabase = createClient()
    const { error } = await supabase.rpc('admin_toggle_ban_user', { target_user_id: userId, ban_status: isBanned })

    if (error) {
        console.error("[BanUser] Error calling RPC:", error);
        return { success: false, error: error.message }
    }
    
    // Verify it actually saved
    const { data: checkData } = await supabase.from('profiles').select('is_banned').eq('id', userId).single();
    console.log(`[BanUser] Verified DB value after RPC: `, checkData);
    
    if (checkData?.is_banned !== isBanned) {
        console.error("[BanUser] DB did NOT update properly. Is RPC executing successfully without committing?!");
    }

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
    const { error } = await supabase.rpc('admin_clear_all_messages', {})

    if (error) return { success: false, error: error.message }
    return { success: true }
}

export async function deleteUser(userId: string) {
    if (!await checkAdmin()) return { success: false, error: 'Unauthorized' }

    const supabase = createClient()
    const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId })

    if (error) {
        console.error("[DeleteUser] Error calling RPC:", error);
        return { success: false, error: error.message }
    }
    return { success: true }
}

export async function deleteFeedback(feedbackId: string) {
    if (!await checkAdmin()) return { success: false, error: 'Unauthorized' }

    try {
        const supabase = createClient()
        const { error } = await supabase.rpc('admin_delete_feedback', { target_feedback_id: feedbackId })

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

    // Use RPC to bypass RLS securely
    const rpcPayload = {
        config_key: key,
        config_value: JSON.stringify(storeValue)
    };
    
    console.log(`[AdminConfig] Calling RPC with:`, rpcPayload);
    const { data, error } = await supabase.rpc('admin_update_app_config', rpcPayload);

    if (error) {
        console.error(`[AdminConfig] Error executing RPC:`, error.message);
        return { success: false, error: error.message }
    }

    // Explicitly verify the write action
    const { data: dbVerify } = await supabase.from('app_config').select('*').eq('key', key).single();
    console.log(`[AdminConfig] Verification Check DB value for ${key}:`, dbVerify);
    
    if (dbVerify && dbVerify.value !== JSON.stringify(storeValue) && dbVerify.value !== storeValue.toString()) {
        console.error(`[AdminConfig] Write failed to persist! Expected ${JSON.stringify(storeValue)} but got ${dbVerify.value}. Check Supabase RPC logic.`);
    }

    return { success: true, data }
}
