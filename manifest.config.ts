import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'GenovaAI - Smart Quiz Assistant',
  version: pkg.version,
  description: 'AI-powered quiz assistant with context menu integration',
  icons: {
    48: 'public/logo.png',
  },
  permissions: [
    'contextMenus',
    'storage',
    'activeTab',
    'scripting',
  ],
  host_permissions: [
    'https://openrouter.ai/*',
    'https://generativelanguage.googleapis.com/*',
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
