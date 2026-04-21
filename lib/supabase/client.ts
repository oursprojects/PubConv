import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

// Custom storage for Capacitor
const capacitorStorage = {
    getItem: async (key: string) => {
        const { Preferences } = await import('@capacitor/preferences');
        const { value } = await Preferences.get({ key });
        return value;
    },
    setItem: async (key: string, value: string) => {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({ key, value });
    },
    removeItem: async (key: string) => {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key });
    },
};

export function createClient() {
    if (!client) {
        // Detect native environment
        const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

        client = createBrowserClient(
            supabaseUrl,
            supabaseKey,
            {
                auth: {
                    storage: isNative ? capacitorStorage : undefined,
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                },
                global: {
                    fetch: (url, options) => {
                        return fetch(url, { ...options, cache: 'no-store' });
                    }
                }
            }
        )
    }
    return client
}
