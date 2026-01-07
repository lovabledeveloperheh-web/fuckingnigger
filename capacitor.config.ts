import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.55f9cac6532e42d5905a9c8106220862',
  appName: 'CloudVault',
  webDir: 'dist',
  server: {
    url: 'https://55f9cac6-532e-42d5-905a-9c8106220862.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    // Background sync configuration
    BackgroundRunner: {
      label: 'com.cloudvault.background.sync',
      src: 'background.js',
      event: 'syncFiles',
      repeat: true,
      interval: 15, // Run every 15 minutes
      autoStart: true
    }
  }
};

export default config;
