import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.lumobites.app',
  appName: 'Lumo Bites',
  webDir: 'out',
  server: {
    url: 'https://lumobites.net',
    cleartext: false,
    allowNavigation: ['lumobites.net']
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#ffffff',
    limitsNavigationsToAppBoundDomains: false
  }
};

export default config;
