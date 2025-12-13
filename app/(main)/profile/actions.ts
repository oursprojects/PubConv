'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Not authenticated' }
    }

    const bio = formData.get('bio') as string
    const avatarFile = formData.get('avatar_file') as File | null

    // Fetch current profile to check cooldown and get old avatar
    const { data: profile } = await supabase
        .from('profiles')
        .select('last_avatar_update, avatar_url')
        .eq('id', user.id)
        .single()

    const updates: any = {
        updated_at: new Date().toISOString(),
    }

    if (bio !== null) updates.bio = bio

    if (avatarFile && avatarFile.size > 0) {
        // 1. Check Cooldown (3 days = 72 hours)
        if (profile?.last_avatar_update) {
            const lastUpdate = new Date(profile.last_avatar_update);
            const now = new Date();
            const diffHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

            if (diffHours < 72) {
                const daysRemaining = Math.ceil((72 - diffHours) / 24);
                return { error: `You can change your avatar again in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}.` };
            }
        }

        // 2. Delete old avatar if it exists and is not an external URL (basic check)
        if (profile?.avatar_url && profile.avatar_url.includes('avatars')) {
            try {
                const oldPath = profile.avatar_url.split('/avatars/')[1];
                if (oldPath) {
                    await supabase.storage.from('avatars').remove([oldPath]);
                }
            } catch (e) {
                // Ignore deletion errors, don't block upload
                console.error("Failed to delete old avatar", e);
            }
        }

        // 3. Upload new avatar
        const fileExt = 'webp'; // We enforce webp client side or here
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, {
                upsert: true,
                contentType: 'image/webp'
            });

        if (uploadError) {
            return { error: 'Failed to upload image: ' + uploadError.message };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        updates.avatar_url = publicUrl;
        updates.last_avatar_update = new Date().toISOString();
    }

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    // Sync avatar to auth metadata so header updates immediately
    if (updates.avatar_url) {
        await supabase.auth.updateUser({
            data: { avatar_url: updates.avatar_url }
        });
    }

    revalidatePath('/profile')
    revalidatePath('/') // Update on chat if needed
    return { success: true }
}

export async function deleteAvatar() {
    const supabase = await createClient()
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
    // We do NOT reset last_avatar_update, so cooldown remains if they deleted it.
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
    await supabase.auth.updateUser({ data: { avatar_url: null } })

    revalidatePath('/')
    revalidatePath('/profile')
    return { success: true }
}
