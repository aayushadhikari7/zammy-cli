import { registerCommand } from './registry.js';

registerCommand({
  name: 'clear',
  description: 'Clear the terminal screen',
  usage: '/clear',
  async execute(_args: string[]) {
    console.clear();
  },
});
