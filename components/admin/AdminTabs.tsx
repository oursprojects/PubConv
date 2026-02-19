"use client";

import { Tabs } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function AdminTabs({
    children,
    defaultTab = "system"
}: {
    children: React.ReactNode,
    defaultTab?: string
}) {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || defaultTab;
    const [currentTab, setCurrentTab] = useState(initialTab);

    // If the user navigates back/forward, we want to sync the state
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl && tabFromUrl !== currentTab) {
            setCurrentTab(tabFromUrl);
        }
    }, [searchParams]);

    const onTabChange = (value: string) => {
        setCurrentTab(value);

        // Update URL efficiently without triggering server component re-render
        const params = new URLSearchParams(window.location.search);
        params.set('tab', value);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, '', newUrl);
    };

    return (
        <Tabs value={currentTab} onValueChange={onTabChange} className="space-y-6">
            {children}
        </Tabs>
    )
}
