import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import {
  parseDate,
  parseDuration,
  addDuration,
  subtractDuration,
  diffDates,
  getTimezoneOffset,
  getTimezoneNames,
  formatDate,
  getDateTimeInfo,
  convertTimezone,
  formatInTimezone,
} from '../../handlers/utilities/datetime.js';

function showNow(timezone?: string): void {
  const now = new Date();
  const info = getDateTimeInfo(now);

  console.log('');
  console.log(`  ${symbols.info} ${theme.primary('Current Time')}`);
  console.log('');
  console.log(`  ${theme.dim('ISO:')}      ${theme.success(info.iso)}`);
  console.log(`  ${theme.dim('Local:')}    ${info.local}`);
  console.log(`  ${theme.dim('UTC:')}      ${info.utc}`);
  console.log(`  ${theme.dim('Unix:')}     ${theme.accent(info.unix.toString())}`);

  if (timezone) {
    const offset = getTimezoneOffset(timezone);
    if (offset !== null) {
      console.log(`  ${theme.dim(timezone + ':')}    ${formatInTimezone(now, offset)}`);
    }
  }

  console.log('');
}

function showConvert(dateStr: string, fromTz: string, toTz: string): void {
  const date = parseDate(dateStr);
  if (!date) {
    console.log(theme.error(`Cannot parse date: ${dateStr}`));
    return;
  }

  const result = convertTimezone(date, fromTz, toTz);
  if (!result) {
    console.log(theme.error(`Invalid timezone. Available: ${getTimezoneNames().join(', ')}`));
    return;
  }

  const fromOffset = getTimezoneOffset(fromTz)!;
  const toOffset = getTimezoneOffset(toTz)!;

  console.log('');
  console.log(`  ${symbols.info} ${theme.primary('Timezone Conversion')}`);
  console.log('');
  console.log(`  ${theme.dim(fromTz + ':')} ${formatInTimezone(date, fromOffset)}`);
  console.log(`  ${theme.dim(toTz + ':')}  ${formatInTimezone(date, toOffset)}`);
  console.log('');
}

function showAdd(dateStr: string, durationStr: string, subtract: boolean = false): void {
  const date = parseDate(dateStr);
  if (!date) {
    console.log(theme.error(`Cannot parse date: ${dateStr}`));
    return;
  }

  const duration = parseDuration(durationStr);
  if (!duration) {
    console.log(theme.error(`Cannot parse duration: ${durationStr}`));
    console.log(theme.dim('  Examples: 5d, 2h30m, "1 week 3 days"'));
    return;
  }

  const result = subtract ? subtractDuration(date, duration) : addDuration(date, duration);
  const info = getDateTimeInfo(result);

  console.log('');
  console.log(`  ${symbols.info} ${theme.primary(subtract ? 'Date Subtraction' : 'Date Addition')}`);
  console.log('');
  console.log(`  ${theme.dim('From:')}   ${date.toISOString()}`);
  console.log(`  ${theme.dim(subtract ? 'Minus:' : 'Plus:')}  ${durationStr}`);
  console.log(`  ${theme.dim('Result:')} ${theme.success(info.iso)}`);
  console.log(`  ${theme.dim('Local:')}  ${info.local}`);
  console.log('');
}

function showDiff(date1Str: string, date2Str: string): void {
  const date1 = parseDate(date1Str);
  const date2 = parseDate(date2Str);

  if (!date1) {
    console.log(theme.error(`Cannot parse first date: ${date1Str}`));
    return;
  }
  if (!date2) {
    console.log(theme.error(`Cannot parse second date: ${date2Str}`));
    return;
  }

  const diff = diffDates(date1, date2);

  console.log('');
  console.log(`  ${symbols.info} ${theme.primary('Date Difference')}`);
  console.log('');
  console.log(`  ${theme.dim('From:')} ${date1.toISOString()}`);
  console.log(`  ${theme.dim('To:')}   ${date2.toISOString()}`);
  console.log('');
  console.log(`  ${theme.success(`${diff.days}d ${diff.hours}h ${diff.minutes}m ${diff.seconds}s`)}`);
  console.log(`  ${theme.dim(`(${diff.total.toLocaleString()} seconds total)`)}`);
  console.log('');
}

function showFormat(dateStr: string, formatStr: string): void {
  const date = parseDate(dateStr);
  if (!date) {
    console.log(theme.error(`Cannot parse date: ${dateStr}`));
    return;
  }

  const result = formatDate(date, formatStr);

  console.log('');
  console.log(`  ${theme.dim('Input:')}  ${date.toISOString()}`);
  console.log(`  ${theme.dim('Format:')} ${formatStr}`);
  console.log(`  ${theme.dim('Result:')} ${theme.success(result)}`);
  console.log('');
}

function showHelp(): void {
  console.log('');
  console.log(theme.primary('Usage:'));
  console.log(`  ${theme.accent('/datetime now')} ${theme.dim('[timezone]')}     - Current time`);
  console.log(`  ${theme.accent('/datetime convert')} ${theme.dim('<date> <from> <to>')} - Convert timezone`);
  console.log(`  ${theme.accent('/datetime add')} ${theme.dim('<date> <duration>')}  - Add duration`);
  console.log(`  ${theme.accent('/datetime sub')} ${theme.dim('<date> <duration>')}  - Subtract duration`);
  console.log(`  ${theme.accent('/datetime diff')} ${theme.dim('<date1> <date2>')}   - Difference`);
  console.log(`  ${theme.accent('/datetime format')} ${theme.dim('<date> <format>')}  - Format date`);
  console.log('');
  console.log(theme.primary('Timezones:'));
  console.log(theme.dim(`  ${getTimezoneNames().join(', ')}`));
  console.log(theme.dim('  Or use UTC+X, UTC-X format'));
  console.log('');
  console.log(theme.primary('Duration format:'));
  console.log(theme.dim('  5d, 2h, 30m, 1w, 1y, "2 days 3 hours"'));
  console.log('');
  console.log(theme.primary('Format tokens:'));
  console.log(theme.dim('  YYYY, MM, DD, HH, mm, ss, A/a'));
  console.log('');
}

registerCommand({
  name: 'datetime',
  description: 'Date and timezone utilities',
  usage: '/datetime <subcommand> [args]',
  async execute(args: string[]) {
    const subcommand = args[0]?.toLowerCase();

    if (!subcommand || subcommand === 'now') {
      showNow(args[1]);
      return;
    }

    if (subcommand === 'help' || subcommand === '--help') {
      showHelp();
      return;
    }

    if (subcommand === 'convert' || subcommand === 'conv') {
      if (args.length < 4) {
        console.log(theme.error('Usage: /datetime convert <date> <from-tz> <to-tz>'));
        return;
      }
      showConvert(args[1], args[2], args[3]);
      return;
    }

    if (subcommand === 'add') {
      if (args.length < 3) {
        console.log(theme.error('Usage: /datetime add <date> <duration>'));
        return;
      }
      showAdd(args[1], args.slice(2).join(' '));
      return;
    }

    if (subcommand === 'sub' || subcommand === 'subtract') {
      if (args.length < 3) {
        console.log(theme.error('Usage: /datetime sub <date> <duration>'));
        return;
      }
      showAdd(args[1], args.slice(2).join(' '), true);
      return;
    }

    if (subcommand === 'diff') {
      if (args.length < 3) {
        console.log(theme.error('Usage: /datetime diff <date1> <date2>'));
        return;
      }
      showDiff(args[1], args[2]);
      return;
    }

    if (subcommand === 'format' || subcommand === 'fmt') {
      if (args.length < 3) {
        console.log(theme.error('Usage: /datetime format <date> <format>'));
        return;
      }
      showFormat(args[1], args.slice(2).join(' '));
      return;
    }

    // Maybe they passed a date directly
    const date = parseDate(args.join(' '));
    if (date) {
      const info = getDateTimeInfo(date);
      console.log('');
      console.log(`  ${symbols.info} ${theme.primary('Date Info')}`);
      console.log('');
      console.log(`  ${theme.dim('ISO:')}      ${theme.success(info.iso)}`);
      console.log(`  ${theme.dim('Local:')}    ${info.local}`);
      console.log(`  ${theme.dim('UTC:')}      ${info.utc}`);
      console.log(`  ${theme.dim('Unix:')}     ${theme.accent(info.unix.toString())}`);
      console.log(`  ${theme.dim('Relative:')} ${info.relative}`);
      console.log('');
      return;
    }

    console.log(theme.error(`Unknown subcommand: ${subcommand}`));
    showHelp();
  },
});
