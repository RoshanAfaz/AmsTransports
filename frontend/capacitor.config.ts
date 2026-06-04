import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amstransports.app',
  appName: 'AMS Transports',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlay: false,
      backgroundColor: '#0d1326'
    }
  }
};

export default config;
