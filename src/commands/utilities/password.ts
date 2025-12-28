import { registerCommand } from '../registry.js';
import { theme, symbols, box } from '../../ui/colors.js';
import { generatePassword, PasswordStrength } from '../../handlers/utilities/password.js';

function getStrengthColor(strength: PasswordStrength): (s: string) => string {
  switch (strength.label) {
    case 'Weak': return theme.error;
    case 'Fair': return theme.warning;
    case 'Good': return theme.primary;
    case 'Strong': return theme.success;
  }
}

registerCommand({
  name: 'password',
  description: 'Generate a secure password',
  usage: '/password [length] [--no-symbols] [--no-numbers] [--no-upper] [--no-lower]',
  async execute(args: string[]) {
    let length = 16;
    const options = {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    };

    // Parse arguments
    for (const arg of args) {
      if (/^\d+$/.test(arg)) {
        length = parseInt(arg);
      } else if (arg === '--no-symbols') {
        options.symbols = false;
      } else if (arg === '--no-numbers') {
        options.numbers = false;
      } else if (arg === '--no-upper') {
        options.uppercase = false;
      } else if (arg === '--no-lower') {
        options.lowercase = false;
      }
    }

    const result = generatePassword(length, options);
    const strengthColor = getStrengthColor(result.strength);

    // Create strength bar
    const barLength = 20;
    const filledLength = Math.round((result.strength.score / 7) * barLength);
    const bar = strengthColor('█'.repeat(filledLength)) + theme.dim('░'.repeat(barLength - filledLength));

    console.log('');
    console.log(box.draw([
      '',
      `  ${symbols.lock} ${theme.secondary('Generated Password')}`,
      '',
      `  ${theme.highlight(result.password)}`,
      '',
      `  ${theme.dim('Strength:')} ${bar} ${strengthColor(result.strength.label)}`,
      `  ${theme.dim('Length:')} ${result.length} characters`,
      '',
    ], 60));
    console.log('');
  },
});
