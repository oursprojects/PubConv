// Client-side feedback and profile functions for mobile app (static export)

import { createClient } from '@/lib/supabase/client'

// ========== FEEDBACK ==========

export async function submitFeedbackClient(subject: string, message: string) {
    const supabase = createClient()

    // Check connection first
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return { error: 'No internet connection. Please connect to send feedback.' }
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
        return { error: 'You must be logged in to submit feedback.' }
    }
    const user = session.user

    if (!subject || !message) {
        return { error: 'Subject and message are required.' }
    }

    const { error } = await supabase
        .from('feedbacks')
        .insert({
            user_id: user.id,
            content: `${subject}: ${message}`,
        })

    if (error) {
        console.error('Feedback error:', error)
        return { error: 'Failed to submit feedback. Please try again.' }
    }

    return { success: true }
}

// ========== PROFILE ==========

export async function updateProfileClient(bio: string | null, avatarFile: File | null) {
    const supabase = createClient()

    // Check connection first
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return { error: 'No internet connection. Please connect to update your profile.' }
    }

    // Use getSession for better mobile support
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
        return { error: 'Not authenticated. Please log in.' }
    }
    const user = session.user

    // Fetch current profile to check cooldown and get old avatar
    const { data: profile } = await supabase
        .from('profiles')
        .select('last_avatar_update, avatar_url')
        .eq('id', user.id)
        .single()

    const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    }

    if (bio !== null) updates.bio = bio

    if (avatarFile && avatarFile.size > 0) {
        // 1. Check Cooldown (3 days = 72 hours)
        if (profile?.last_avatar_update) {
            const lastUpdate = new Date(profile.last_avatar_update)
            const now = new Date()
            const diffHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60)

            if (diffHours < 72) {
                const daysRemaining = Math.ceil((72 - diffHours) / 24)
                return { error: `You can change your avatar again in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}.` }
            }
        }

        // 2. Delete old avatar if it exists
        if (profile?.avatar_url && profile.avatar_url.includes('avatars')) {
            try {
                const oldPath = profile.avatar_url.split('/avatars/')[1]
                if (oldPath) {
                    await supabase.storage.from('avatars').remove([oldPath])
                }
            } catch (e) {
                console.error("Failed to delete old avatar", e)
            }
        }

        // 3. Upload new avatar
        const fileExt = 'webp'
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, {
                upsert: true,
                contentType: 'image/webp'
            })

        if (uploadError) {
            return { error: 'Failed to upload image: ' + uploadError.message }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)

        updates.avatar_url = publicUrl
        updates.last_avatar_update = new Date().toISOString()
    }

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    // Sync avatar to auth metadata
    if (updates.avatar_url) {
        await supabase.auth.updateUser({
            data: { avatar_url: updates.avatar_url as string }
        })
    }

    return { success: true }
}

export async function deleteAvatarClient() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    // 1. Get current avatar path
    const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()

    if (profile?.avatar_url && profile.avatar_url.includes('avatars')) {
        try {
            const path = profile.avatar_url.split('/avatars/')[1]
            if (path) {
                await supabase.storage.from('avatars').remove([path])
            }
        } catch (e) {
            console.error("Error removing file:", e)
        }
    }

    // 2. Update Profile & Auth Metadata
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
    await supabase.auth.updateUser({ data: { avatar_url: null } })

    return { success: true }
}
