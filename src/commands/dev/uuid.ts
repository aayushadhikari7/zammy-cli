import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { generateUuids } from '../../handlers/dev/uuid.js';

registerCommand({
  name: 'uuid',
  description: 'Generate UUID(s)',
  usage: '/uuid [count]',
  async execute(args: string[]) {
    const count = parseInt(args[0]) || 1;
    const result = generateUuids(count);

    console.log('');
    console.log(`  ${symbols.sparkle} ${theme.gradient('UUID GENERATOR')} ${symbols.sparkle}`);
    console.log('');

    result.uuids.forEach((uuid, i) => {
      console.log(`  ${theme.dim(`${i + 1}.`)} ${theme.primary(uuid)}`);
    });

    console.log('');
    if (result.count === 1) {
      console.log(theme.dim('  Tip: /uuid 5 generates 5 UUIDs'));
    }
    console.log('');
  },
});
