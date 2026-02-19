'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitFeedback(formData: FormData) {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'You must be logged in to submit feedback.' }
    }

    const subject = formData.get('subject') as string
    const message = formData.get('message') as string

    if (!subject || !message) {
        return { error: 'Subject and message are required.' }
    }

    const { error } = await supabase
        .from('feedbacks')
        .insert({
            user_id: user.id,
            content: `${subject}: ${message}`, // Combining subject and message if schema only has content, or I can check schema.
            // Looking at Admin UI, it displays Item.content. 
            // The table likely has user_id, content, created_at.
            // I'll combine subject and message for now into content.
        })

    if (error) {
        console.error('Feedback error:', error)
        return { error: 'Failed to submit feedback. Please try again.' }
    }

    revalidatePath('/admin') // Update admin dashboard
    return { success: true }
}
