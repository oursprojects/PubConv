import { createClient } from '@/lib/supabase/client'

export async function submitFeedback(formData: FormData) {
    const supabase = createClient()

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
            content: `${subject}: ${message}`,
        })

    if (error) {
        console.error('Feedback error:', error)
        return { error: 'Failed to submit feedback. Please try again.' }
    }

    return { success: true }
}
