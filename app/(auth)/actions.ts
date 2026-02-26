import { createClient } from '@/lib/supabase/client'

export async function login(formData: FormData) {
    const supabase = createClient()

    const username = formData.get('username') as string
    const password = formData.get('password') as string

    // Construct email from username
    const email = `${username}@internal.app`;

    try {
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

        return { success: true }
    } catch (err: any) {
        console.error("Login fetch error:", err);
        return { error: "Network error. Please check your connection or configuration." }
    }
}

export async function signup(formData: FormData) {
    const supabase = createClient()

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const username = formData.get('username') as string
    const recaptchaToken = formData.get('recaptchaToken') as string

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

    // NOTE: reCAPTCHA verification against Google API requires the secret key.
    // Exposing the secret key on the client is a security risk.
    // For the mobile app (static export), this should ideally be handled by a Supabase Edge Function.
    // For now, we will skip the server-side verification if we can't do it securely, 
    // or just assume the client-side check happened.

    // Auto-generate email since we only ask for username
    const email = `${username}@internal.app`;

    try {
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

        return { success: true, session: !!data.session }
    } catch (err: any) {
        console.error("Signup fetch error:", err);
        return { error: "Network error. Please check your connection or configuration." }
    }
}

export async function updatePassword(formData: FormData) {
    const supabase = createClient()
    const password = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    try {
        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            return { error: error.message }
        }

        return { success: true }
    } catch (err: any) {
        console.error("Update password fetch error:", err);
        return { error: "Network error. Please check your connection or configuration." }
    }
}
