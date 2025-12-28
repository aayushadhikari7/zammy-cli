import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';

// Safe math expression evaluator (no eval!)
function evaluate(expression: string): number | null {
  // Remove spaces
  const expr = expression.replace(/\s+/g, '');

  // Validate: only allow numbers, operators, parentheses, and decimal points
  if (!/^[\d+\-*/().%^]+$/.test(expr)) {
    return null;
  }

  try {
    // Replace ^ with ** for exponentiation
    const sanitized = expr.replace(/\^/g, '**');

    // Use Function constructor (safer than eval, but still sandboxed)
    const result = new Function(`return (${sanitized})`)();

    if (typeof result !== 'number' || !isFinite(result)) {
      return null;
    }

    return result;
  } catch {
    return null;
  }
}

function formatNumber(num: number): string {
  // Handle very small or very large numbers
  if (Math.abs(num) < 0.0001 || Math.abs(num) > 1e10) {
    return num.toExponential(4);
  }

  // Round to avoid floating point issues
  const rounded = Math.round(num * 1e10) / 1e10;

  // Format with commas for thousands
  const parts = rounded.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return parts.join('.');
}

registerCommand({
  name: 'calc',
  description: 'Calculate a math expression',
  usage: '/calc <expression>',
  async execute(args: string[]) {
    const expression = args.join(' ');

    if (!expression) {
      console.log(theme.error('Usage: /calc <expression>'));
      console.log('');
      console.log(theme.dim('Examples:'));
      console.log(theme.dim('  /calc 2 + 2'));
      console.log(theme.dim('  /calc (10 * 5) / 2'));
      console.log(theme.dim('  /calc 2^8'));
      console.log(theme.dim('  /calc 100 % 7'));
      return;
    }

    const result = evaluate(expression);

    console.log('');
    if (result === null) {
      console.log(`  ${symbols.cross} ${theme.error('Invalid expression')}`);
    } else {
      console.log(`  ${theme.dim(expression)} ${theme.dim('=')} ${theme.success(formatNumber(result))}`);
    }
    console.log('');
  },
});
