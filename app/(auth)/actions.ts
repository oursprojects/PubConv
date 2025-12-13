'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const username = formData.get('username') as string
    const password = formData.get('password') as string

    // Construct email from username
    const email = `${username}@internal.app`;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Check if user is banned
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_banned')
            .eq('id', user.id)
            .single();

        if (profile?.is_banned) {
            await supabase.auth.signOut();
            return { error: 'Your account has been banned.' };
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const username = formData.get('username') as string
    const recaptchaToken = formData.get('recaptchaToken') as string

    // Validate password length
    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters long.' }
    }

    // Validate passwords match
    if (password !== confirmPassword) {
        return { error: 'Passwords do not match.' }
    }

    // Verify reCAPTCHA token
    if (!recaptchaToken) {
        return { error: 'Please complete the reCAPTCHA verification.' }
    }

    const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
    })

    const recaptchaData = await recaptchaResponse.json()
    if (!recaptchaData.success) {
        return { error: 'reCAPTCHA verification failed. Please try again.' }
    }

    // Auto-generate email since we only ask for username
    const email = `${username}@internal.app`;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username,
                display_name: username, // Use username as display_name
            }
        }
    })

    if (error) {
        return { error: error.message }
    }

    // Success! If session exists, user is logged in. Redirect to home.
    if (data.session) {
        redirect('/')
    }

    // Check email fallback
    return { message: 'Account created! Please check your email to confirm.' }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}
