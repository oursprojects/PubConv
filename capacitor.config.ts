import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pubconv.app',
  appName: 'PubConv',
  webDir: 'out',
  plugins: {
    StatusBar: {
      style: 'DARK',
      overlaysWebView: true,
      backgroundColor: '#ffffff',
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
