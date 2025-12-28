import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { calculate, isCalcError } from '../../handlers/utilities/calc.js';

registerCommand({
  name: 'calc',
  description: 'Calculate a math expression',
  usage: '/calc <expression>',
  async execute(args: string[]) {
    const expression = args.join(' ');

    if (!expression) {
      console.log('');
      console.log(`  ${symbols.warning} ${theme.warning('Usage:')} ${theme.command('/calc')} ${theme.dim('<expression>')}`);
      console.log('');
      console.log(`  ${theme.dim('Examples:')}`);
      console.log(`    ${theme.primary('/calc 2 + 2')}        ${theme.dim('→')} Basic math`);
      console.log(`    ${theme.primary('/calc (10 * 5) / 2')} ${theme.dim('→')} Parentheses`);
      console.log(`    ${theme.primary('/calc 2^8')}          ${theme.dim('→')} Exponents`);
      console.log(`    ${theme.primary('/calc 100 % 7')}      ${theme.dim('→')} Modulo`);
      console.log('');
      return;
    }

    const result = calculate(expression);

    console.log('');
    if (isCalcError(result)) {
      console.log(`  ${symbols.cross} ${theme.error('Invalid expression:')} ${theme.dim(expression)}`);
      console.log(`  ${theme.dim('Only numbers and operators (+, -, *, /, ^, %) are allowed')}`);
    } else {
      console.log(`  ${theme.dim('┌─────────────────────────────────────────┐')}`);
      console.log(`  ${theme.dim('│')}  ${theme.secondary(expression)}${' '.repeat(Math.max(0, 37 - expression.length))}${theme.dim('│')}`);
      console.log(`  ${theme.dim('│')}  ${theme.dim('=')} ${theme.b.success(result.formatted)}${' '.repeat(Math.max(0, 35 - result.formatted.length))}${theme.dim('│')}`);
      console.log(`  ${theme.dim('└─────────────────────────────────────────┘')}`);
    }
    console.log('');
  },
});
