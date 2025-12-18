import type { Config } from "tailwindcss"

const config = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                sans: ["var(--font-sans)", "system-ui", "sans-serif"],
                poppins: ["var(--font-poppins)", "system-ui", "sans-serif"],
                roboto: ["var(--font-roboto)", "system-ui", "sans-serif"],
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0", opacity: "0" },
                    to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
                    to: { height: "0", opacity: "0" },
                },
                wave: {
                    "0%, 100%": { transform: "scaleY(0.5)" },
                    "50%": { transform: "scaleY(1)" },
                },
                // Smooth fade and scale for dropdowns/popovers
                "scale-in": {
                    from: { opacity: "0", transform: "scale(0.95) translateY(-4px)" },
                    to: { opacity: "1", transform: "scale(1) translateY(0)" },
                },
                "scale-out": {
                    from: { opacity: "1", transform: "scale(1) translateY(0)" },
                    to: { opacity: "0", transform: "scale(0.95) translateY(-4px)" },
                },
                // Slide animations
                "slide-up": {
                    from: { opacity: "0", transform: "translateY(10px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                "slide-down": {
                    from: { opacity: "0", transform: "translateY(-10px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                "slide-left": {
                    from: { opacity: "0", transform: "translateX(10px)" },
                    to: { opacity: "1", transform: "translateX(0)" },
                },
                "slide-right": {
                    from: { opacity: "0", transform: "translateX(-10px)" },
                    to: { opacity: "1", transform: "translateX(0)" },
                },
                // Pulse for attention
                "pulse-soft": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.7" },
                },
                // Shimmer loading effect
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                // Bounce effect
                "bounce-in": {
                    "0%": { opacity: "0", transform: "scale(0.3)" },
                    "50%": { transform: "scale(1.05)" },
                    "70%": { transform: "scale(0.9)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                },
                // Glow effect
                glow: {
                    "0%, 100%": { boxShadow: "0 0 5px hsl(var(--primary) / 0.5)" },
                    "50%": { boxShadow: "0 0 20px hsl(var(--primary) / 0.8)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
                "accordion-up": "accordion-up 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
                wave: "wave 1s ease-in-out infinite",
                "scale-in": "scale-in 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
                "scale-out": "scale-out 0.15s cubic-bezier(0.32, 0.72, 0, 1)",
                "slide-up": "slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
                "slide-down": "slide-down 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
                "slide-left": "slide-left 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
                "slide-right": "slide-right 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
                "pulse-soft": "pulse-soft 2s ease-in-out infinite",
                shimmer: "shimmer 2s linear infinite",
                "bounce-in": "bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                glow: "glow 2s ease-in-out infinite",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
