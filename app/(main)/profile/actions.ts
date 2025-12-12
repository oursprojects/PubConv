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
    const avatarUrl = formData.get('avatar_url') as string

    const updates: any = {
        updated_at: new Date().toISOString(),
    }

    if (bio !== null) updates.bio = bio
    if (avatarUrl !== null) updates.avatar_url = avatarUrl

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/profile')
    revalidatePath('/') // Update on chat if needed
    return { success: true }
}
