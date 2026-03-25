import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.caremypet.app',
  appName: 'CareMyPet',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  }
};

export default config;
