import type { ZammyConfig } from './types.js';

export const DEFAULT_CONFIG: ZammyConfig = {
  // UI preferences
  theme: 'default',
  showBanner: true,
  showIdleAnimation: true,
  showCommandMenu: true,

  // Prompt customization
  prompt: {
    symbol: '>',
    showTime: false,
    showDirectory: true,
  },

  // Behavior
  historySize: 100,
  confirmExit: true,

  // Plugins
  autoLoadPlugins: [],

  // Editor
  editor: process.env.EDITOR || process.env.VISUAL || 'code',
};
