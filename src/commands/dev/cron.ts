import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import { describeCron, getNextOccurrences, buildCronFromDescription } from '../../handlers/dev/cron.js';

registerCommand({
  name: 'cron',
  description: 'Parse and build cron expressions',
  usage: '/cron parse <expression> | /cron build <description> | /cron next <expression> [count]',
  async execute(args: string[]) {
    if (args.length === 0) {
      console.log('');
      console.log(theme.error('Usage:'));
      console.log(`  ${theme.accent('/cron parse')} ${theme.dim('"0 9 * * 1-5"')}  - Describe expression`);
      console.log(`  ${theme.accent('/cron build')} ${theme.dim('"every weekday at 9am"')} - Build expression`);
      console.log(`  ${theme.accent('/cron next')} ${theme.dim('"0 9 * * *" 5')}  - Next N occurrences`);
      console.log('');
      console.log(theme.dim('  Cron format: minute hour day month dayOfWeek'));
      console.log(theme.dim('  Fields: 0-59 0-23 1-31 1-12 0-6 (0=Sunday)'));
      console.log('');
      console.log(theme.dim('  Special characters:'));
      console.log(theme.dim('    * = any, */n = every n, n-m = range'));
      console.log('');
      return;
    }

    const subcommand = args[0].toLowerCase();

    if (subcommand === 'parse' || subcommand === 'explain' || subcommand === 'describe') {
      const expression = args.slice(1).join(' ').replace(/["']/g, '');

      if (!expression) {
        console.log(theme.error('Usage: /cron parse <expression>'));
        return;
      }

      const result = describeCron(expression);

      console.log('');
      if (!result.isValid) {
        console.log(`  ${symbols.cross} ${theme.error('Invalid cron expression')}`);
        console.log(`  ${theme.dim(result.error)}`);
        console.log('');
        return;
      }

      console.log(`  ${symbols.info} ${theme.primary('Cron Expression')}`);
      console.log('');
      console.log(`  ${theme.dim('Expression:')} ${theme.accent(result.expression)}`);
      console.log('');
      console.log(`  ${theme.dim('┌─────────')} ${theme.secondary(result.parts.minute.padEnd(8))} ${theme.dim('minute (0-59)')}`);
      console.log(`  ${theme.dim('│ ┌───────')} ${theme.secondary(result.parts.hour.padEnd(8))} ${theme.dim('hour (0-23)')}`);
      console.log(`  ${theme.dim('│ │ ┌─────')} ${theme.secondary(result.parts.dayOfMonth.padEnd(8))} ${theme.dim('day of month (1-31)')}`);
      console.log(`  ${theme.dim('│ │ │ ┌───')} ${theme.secondary(result.parts.month.padEnd(8))} ${theme.dim('month (1-12)')}`);
      console.log(`  ${theme.dim('│ │ │ │ ┌─')} ${theme.secondary(result.parts.dayOfWeek.padEnd(8))} ${theme.dim('day of week (0-6)')}`);
      console.log(`  ${theme.dim('│ │ │ │ │')}`);
      console.log(`  ${theme.accent(result.expression)}`);
      console.log('');
      console.log(`  ${theme.success(result.description)}`);
      console.log('');
      return;
    }

    if (subcommand === 'build' || subcommand === 'create') {
      const description = args.slice(1).join(' ').replace(/["']/g, '');

      if (!description) {
        console.log(theme.error('Usage: /cron build <description>'));
        console.log(theme.dim('  Example: /cron build "every weekday at 9am"'));
        return;
      }

      const expression = buildCronFromDescription(description);

      console.log('');
      if (!expression) {
        console.log(`  ${symbols.cross} ${theme.error('Could not parse description')}`);
        console.log('');
        console.log(theme.dim('  Try formats like:'));
        console.log(theme.dim('    "every minute"'));
        console.log(theme.dim('    "every hour"'));
        console.log(theme.dim('    "every day at 9:00"'));
        console.log(theme.dim('    "every weekday at 9am"'));
        console.log(theme.dim('    "every week at 10:30am"'));
        console.log('');
        return;
      }

      console.log(`  ${symbols.check} ${theme.primary('Cron Expression Built')}`);
      console.log('');
      console.log(`  ${theme.dim('Description:')} ${description}`);
      console.log(`  ${theme.dim('Expression:')}  ${theme.success(expression)}`);

      const desc = describeCron(expression);
      if (desc.isValid) {
        console.log(`  ${theme.dim('Means:')}       ${desc.description}`);
      }
      console.log('');
      return;
    }

    if (subcommand === 'next' || subcommand === 'upcoming') {
      const expression = args[1]?.replace(/["']/g, '');
      const count = parseInt(args[2] || '5', 10);

      if (!expression) {
        console.log(theme.error('Usage: /cron next <expression> [count]'));
        return;
      }

      const occurrences = getNextOccurrences(expression, Math.min(count, 20));

      console.log('');
      if (occurrences.length === 0) {
        console.log(`  ${symbols.cross} ${theme.error('Invalid expression or no occurrences found')}`);
        console.log('');
        return;
      }

      console.log(`  ${symbols.info} ${theme.primary('Next Occurrences')}`);
      console.log(`  ${theme.dim('Expression:')} ${theme.accent(expression)}`);
      console.log('');

      for (let i = 0; i < occurrences.length; i++) {
        const date = occurrences[i];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        console.log(`  ${theme.dim(`${(i + 1).toString().padStart(2)}.`)} ${theme.accent(dayName)} ${dateStr} ${theme.success(timeStr)}`);
      }
      console.log('');
      return;
    }

    // Try to parse as expression directly
    const expression = args.join(' ').replace(/["']/g, '');
    const result = describeCron(expression);

    if (result.isValid) {
      console.log('');
      console.log(`  ${theme.dim('Expression:')} ${theme.accent(expression)}`);
      console.log(`  ${theme.success(result.description)}`);
      console.log('');
      return;
    }

    console.log(theme.error(`Unknown subcommand: ${subcommand}`));
  },
});
