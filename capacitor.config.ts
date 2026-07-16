import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.lumobites.app',
  appName: 'Lumo Bites',
  webDir: 'out',
  server: {
    url: 'https://lumobites.net',
    cleartext: true
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
