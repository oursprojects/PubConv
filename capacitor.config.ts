import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.pubconv.app',
    appName: 'PubConv',
    webDir: 'public',
    server: {
        url: 'https://pubconv.vercel.app',
        androidScheme: 'https'
    }
};

export default config;
