import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'GenovaAI v2 - Smart Quiz Assistant',
  version: pkg.version,
  description: 'AI-powered quiz assistant with backend integration',
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
    'http://localhost:3000/*', // Backend API
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
    default_title: 'GenovaAI Settings',
  },
})
