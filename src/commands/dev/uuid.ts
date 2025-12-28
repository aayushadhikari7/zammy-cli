import { registerCommand } from '../registry.js';
import { theme, symbols, box } from '../../ui/colors.js';
import { randomUUID } from 'crypto';

registerCommand({
  name: 'uuid',
  description: 'Generate UUID(s)',
  usage: '/uuid [count]',
  async execute(args: string[]) {
    const count = Math.min(Math.max(parseInt(args[0]) || 1, 1), 10);

    console.log('');
    console.log(`  ${symbols.sparkle} ${theme.gradient('UUID GENERATOR')} ${symbols.sparkle}`);
    console.log('');

    for (let i = 0; i < count; i++) {
      const uuid = randomUUID();
      console.log(`  ${theme.dim(`${i + 1}.`)} ${theme.primary(uuid)}`);
    }

    console.log('');
    if (count === 1) {
      console.log(theme.dim('  Tip: /uuid 5 generates 5 UUIDs'));
    }
    console.log('');
  },
});
