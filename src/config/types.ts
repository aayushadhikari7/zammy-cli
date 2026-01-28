export interface ZammyConfig {
  // UI preferences
  theme: 'default' | 'minimal' | 'vibrant';
  showBanner: boolean;
  showIdleAnimation: boolean;
  showCommandMenu: boolean;

  // Prompt customization
  prompt: {
    symbol: string;
    showTime: boolean;
    showDirectory: boolean;
  };

  // Behavior
  historySize: number;
  confirmExit: boolean;

  // Plugins
  autoLoadPlugins: string[];

  // Editor for config editing
  editor: string;
}

export type PartialConfig = {
  [K in keyof ZammyConfig]?: ZammyConfig[K] extends object
    ? Partial<ZammyConfig[K]>
    : ZammyConfig[K];
};

export type ConfigKey = keyof ZammyConfig | `prompt.${keyof ZammyConfig['prompt']}`;
