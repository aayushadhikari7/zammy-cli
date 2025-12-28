import { registerCommand } from '../registry.js';
import { theme } from '../../ui/colors.js';

registerCommand({
  name: 'exit',
  description: 'Exit Zammy',
  usage: '/exit',
  async execute(_args: string[]) {
    console.log('');
    console.log(theme.secondary('Goodbye! See you next time.'));
    console.log('');
    process.exit(0);
  },
});
