import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'Genova AI v2 - Smart AI Assistant',
  version: pkg.version,
  description: 'AI-powered for quiz assistant with backend integration',
  icons: {
    48: 'public/logo.png',
  },
  permissions: [
    'contextMenus',
    'storage',
    'activeTab',
    'scripting',
    'alarms', // For token refresh
  ],
  host_permissions: [
    'https://genova.genfity.com/*', // Production API
    'http://localhost:8090/*', // Development API
  ],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [{
    js: ['src/content/index.ts'],
    matches: ['<all_urls>'],
    all_frames: false,
  }],
  options_page: 'src/options/index.html',
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_title: 'Genova AI Settings',
  },
})
