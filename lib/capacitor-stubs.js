// Stub file used during web/Vercel builds.
// On Android (Capacitor WebView), the real packages are used at runtime.
// On web, this stub is activated via webpack alias in next.config.mjs.

export const Capacitor = {
    isNativePlatform: () => false,
    getPlatform: () => "web",
};

// @capacitor/status-bar stubs
export const StatusBar = {
    setOverlaysWebView: async () => { },
    setStyle: async () => { },
};
export const Style = { Dark: "DARK", Light: "LIGHT", Default: "DEFAULT" };

// @capacitor/network stubs
export const Network = {
    getStatus: async () => ({ connected: true, connectionType: "wifi" }),
    addListener: async () => ({ remove: () => { } }),
};
