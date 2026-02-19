// Stub file used during web/Vercel builds.
// On Android (Capacitor WebView), the real packages are used at runtime.
// This stub is activated via webpack alias + tsconfig paths in next.config.mjs.

// @capacitor/core
export const Capacitor = {
    isNativePlatform: (): boolean => false,
    getPlatform: (): string => "web",
};

// @capacitor/status-bar
export const StatusBar = {
    setOverlaysWebView: async (_options: { overlay: boolean }): Promise<void> => { },
    setStyle: async (_options: { style: string }): Promise<void> => { },
    show: async (): Promise<void> => { },
    hide: async (): Promise<void> => { },
};
export const Style = { Dark: "DARK", Light: "LIGHT", Default: "DEFAULT" };

// @capacitor/network
export const Network = {
    getStatus: async (): Promise<{ connected: boolean; connectionType: string }> => ({
        connected: true,
        connectionType: "wifi",
    }),
    addListener: async (
        _event: string,
        _handler: (status: { connected: boolean }) => void
    ): Promise<{ remove: () => void }> => ({ remove: () => { } }),
};

// @capacitor/app
export const App = {
    addListener: async (
        _event: string,
        _handler: () => void
    ): Promise<{ remove: () => void }> => ({ remove: () => { } }),
    exitApp: (): void => { },
};

// @capacitor/haptics
export const Haptics = {
    impact: async (_options?: { style?: string }): Promise<void> => { },
    notification: async (_options?: { type?: string }): Promise<void> => { },
    vibrate: async (): Promise<void> => { },
};
export const ImpactStyle = { Heavy: "HEAVY", Medium: "MEDIUM", Light: "LIGHT" };
export const NotificationType = { Success: "SUCCESS", Warning: "WARNING", Error: "ERROR" };

// @capacitor/keyboard
export const Keyboard = {
    show: async (): Promise<void> => { },
    hide: async (): Promise<void> => { },
    addListener: async (
        _event: string,
        _handler: () => void
    ): Promise<{ remove: () => void }> => ({ remove: () => { } }),
};
