import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true
    },
    webpack: (config) => {
        // On web/Vercel, replace all @capacitor/* imports with a stub file.
        // On Android (Capacitor WebView), the real native packages are used at runtime.
        const stub = path.resolve(__dirname, "lib/capacitor-stubs.ts");

        config.resolve.alias = {
            ...config.resolve.alias,
            "@capacitor/core": stub,
            "@capacitor/status-bar": stub,
            "@capacitor/network": stub,
            "@capacitor/app": stub,
            "@capacitor/haptics": stub,
            "@capacitor/keyboard": stub,
        };

        return config;
    },
};

export default nextConfig;
