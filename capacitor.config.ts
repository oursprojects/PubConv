import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.pubconv.app',
    appName: 'PubConv',
    webDir: 'out',
    server: {
        androidScheme: 'https'
    }
};

export default config;
