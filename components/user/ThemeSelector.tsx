"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";

const themes = [
    { name: "zinc", label: "Zinc", color: "bg-zinc-500" },
    { name: "slate", label: "Slate", color: "bg-slate-500" },
    { name: "stone", label: "Stone", color: "bg-stone-500" },
    { name: "rose", label: "Rose", color: "bg-rose-500" },
    { name: "orange", label: "Orange", color: "bg-orange-500" },
    { name: "green", label: "Green", color: "bg-green-500" },
    { name: "blue", label: "Blue", color: "bg-blue-500" },
    { name: "violet", label: "Violet", color: "bg-violet-500" },
    { name: "yellow", label: "Yellow", color: "bg-yellow-500" },
    { name: "midnight", label: "Midnight", color: "bg-[#052659]" },
];

export function ThemeSelector() {
    const [currentTheme, setCurrentTheme] = useState("zinc");
    const supabase = createClient();
    const { setTheme: setMode, theme: mode } = useTheme();

    useEffect(() => {
        const fetchTheme = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('theme')
                    .eq('id', user.id)
                    .single();

                if (data?.theme) {
                    setCurrentTheme(data.theme);
                    document.documentElement.setAttribute('data-theme', data.theme);
                }
            }
        };
        fetchTheme();
    }, [supabase]);

    const handleThemeChange = async (themeName: string) => {
        setCurrentTheme(themeName);
        document.documentElement.setAttribute('data-theme', themeName);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from('profiles')
                .update({ theme: themeName })
                .eq('id', user.id);
        }
    };

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Color Theme
            </h3>
            <div className="grid grid-cols-5 gap-2">
                {themes.map((theme) => (
                    <button
                        key={theme.name}
                        onClick={() => handleThemeChange(theme.name)}
                        className={cn(
                            "group relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-muted transition-all hover:border-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                            currentTheme === theme.name ? "border-primary" : "border-transparent",
                            theme.color
                        )}
                        title={theme.label}
                    >
                        {currentTheme === theme.name && (
                            <Check className="h-4 w-4 text-white drop-shadow-md" />
                        )}
                        <span className="sr-only">{theme.label}</span>
                    </button>
                ))}
            </div>
            <p className="text-[0.8rem] text-muted-foreground">
                Select a color theme for your interface.
            </p>
        </div>
    );
}
