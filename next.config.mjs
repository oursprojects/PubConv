/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true
    },
    webpack: (config, { isServer }) => {
        // Capacitor packages are only available in native Android/iOS environments.
        // Exclude them from the webpack bundle entirely so the web/Vercel build succeeds.
        config.externals = [
            ...(Array.isArray(config.externals) ? config.externals : []),
            "@capacitor/core",
            "@capacitor/status-bar",
            "@capacitor/network",
            "@capacitor/app",
            "@capacitor/haptics",
            "@capacitor/keyboard",
        ];
        return config;
    },
};

export default nextConfig;
