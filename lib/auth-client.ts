// Client-side auth functions for mobile app (static export)
// These use the Edge Function for reCAPTCHA verification

import { createClient } from '@/lib/supabase/client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Verify reCAPTCHA via Edge Function
async function verifyRecaptcha(token: string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-recaptcha`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        })
        return await response.json()
    } catch {
        return { success: false, error: 'Failed to verify reCAPTCHA' }
    }
}

export async function loginClient(username: string, password: string) {
    const supabase = createClient()

    const email = `${username}@internal.app`

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Check if user is banned
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_banned')
            .eq('id', user.id)
            .single()

        if (profile?.is_banned) {
            await supabase.auth.signOut()
            return { error: 'Your account has been banned.' }
        }
    }

    return { success: true }
}

export async function signupClient(
    username: string,
    password: string,
    confirmPassword: string,
    recaptchaToken: string
) {
    const supabase = createClient()

    // Validate username (alphanumeric only, 3-12 characters)
    const usernameRegex = /^[a-zA-Z0-9]{3,12}$/
    if (!usernameRegex.test(username)) {
        return { error: 'Username must be 3-12 characters and contain only letters and numbers.' }
    }

    // Validate password length (min 6, max 50)
    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters long.' }
    }
    if (password.length > 50) {
        return { error: 'Password must be 50 characters or less.' }
    }

    // Prevent password from being the same as username
    if (password.toLowerCase() === username.toLowerCase()) {
        return { error: 'Password cannot be the same as your username.' }
    }

    // Validate passwords match
    if (password !== confirmPassword) {
        return { error: 'Passwords do not match.' }
    }

    // Verify reCAPTCHA via Edge Function
    if (!recaptchaToken) {
        return { error: 'Please complete the reCAPTCHA verification.' }
    }

    const recaptchaResult = await verifyRecaptcha(recaptchaToken)
    if (!recaptchaResult.success) {
        return { error: recaptchaResult.error || 'reCAPTCHA verification failed. Please try again.' }
    }

    // Auto-generate email since we only ask for username
    const email = `${username}@internal.app`

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username,
            }
        }
    })

    if (error) {
        return { error: error.message }
    }

    // Success! If session exists, user is logged in
    if (data.session) {
        return { success: true, redirect: '/' }
    }

    // No session means signup completed, redirect to login
    return { success: true, redirect: '/login' }
}

export async function updatePasswordClient(newPassword: string, confirmPassword: string) {
    const supabase = createClient()

    if (newPassword !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    const { error } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}
