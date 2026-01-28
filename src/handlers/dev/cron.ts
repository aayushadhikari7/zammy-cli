export interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

export interface CronDescription {
  expression: string;
  parts: CronParts;
  description: string;
  isValid: boolean;
  error?: string;
}

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function parseCronExpression(expression: string): CronParts | null {
  const parts = expression.trim().split(/\s+/);

  if (parts.length !== 5) {
    return null;
  }

  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
  };
}

function parseField(field: string, min: number, max: number): number[] | null {
  const values: number[] = [];

  // Handle *
  if (field === '*') {
    for (let i = min; i <= max; i++) values.push(i);
    return values;
  }

  // Handle */n (step)
  const stepMatch = field.match(/^\*\/(\d+)$/);
  if (stepMatch) {
    const step = parseInt(stepMatch[1], 10);
    for (let i = min; i <= max; i += step) values.push(i);
    return values;
  }

  // Handle comma-separated values
  const parts = field.split(',');
  for (const part of parts) {
    // Handle range with step (e.g., 1-5/2)
    const rangeStepMatch = part.match(/^(\d+)-(\d+)\/(\d+)$/);
    if (rangeStepMatch) {
      const start = parseInt(rangeStepMatch[1], 10);
      const end = parseInt(rangeStepMatch[2], 10);
      const step = parseInt(rangeStepMatch[3], 10);
      for (let i = start; i <= end; i += step) {
        if (i >= min && i <= max) values.push(i);
      }
      continue;
    }

    // Handle range (e.g., 1-5)
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) values.push(i);
      }
      continue;
    }

    // Handle single value
    const num = parseInt(part, 10);
    if (!isNaN(num) && num >= min && num <= max) {
      values.push(num);
    }
  }

  return values.length > 0 ? [...new Set(values)].sort((a, b) => a - b) : null;
}

function describeField(field: string, type: 'minute' | 'hour' | 'day' | 'month' | 'dow'): string {
  if (field === '*') {
    return type === 'minute' ? 'every minute' :
           type === 'hour' ? 'every hour' :
           type === 'day' ? 'every day' :
           type === 'month' ? 'every month' :
           'every day of the week';
  }

  const stepMatch = field.match(/^\*\/(\d+)$/);
  if (stepMatch) {
    const step = stepMatch[1];
    return type === 'minute' ? `every ${step} minutes` :
           type === 'hour' ? `every ${step} hours` :
           type === 'day' ? `every ${step} days` :
           type === 'month' ? `every ${step} months` :
           `every ${step} days`;
  }

  if (type === 'dow') {
    const days = parseField(field, 0, 6);
    if (days) {
      if (days.length === 5 && !days.includes(0) && !days.includes(6)) {
        return 'Monday through Friday';
      }
      if (days.length === 2 && days.includes(0) && days.includes(6)) {
        return 'weekends';
      }
      return days.map(d => DAY_NAMES[d]).join(', ');
    }
  }

  if (type === 'month') {
    const months = parseField(field, 1, 12);
    if (months) {
      return months.map(m => MONTH_NAMES[m]).join(', ');
    }
  }

  return field;
}

export function describeCron(expression: string): CronDescription {
  const parts = parseCronExpression(expression);

  if (!parts) {
    return {
      expression,
      parts: { minute: '', hour: '', dayOfMonth: '', month: '', dayOfWeek: '' },
      description: '',
      isValid: false,
      error: 'Invalid cron expression. Expected 5 fields: minute hour day month dayOfWeek',
    };
  }

  const minuteVals = parseField(parts.minute, 0, 59);
  const hourVals = parseField(parts.hour, 0, 23);
  const dayVals = parseField(parts.dayOfMonth, 1, 31);
  const monthVals = parseField(parts.month, 1, 12);
  const dowVals = parseField(parts.dayOfWeek, 0, 6);

  if (!minuteVals || !hourVals || !dayVals || !monthVals || !dowVals) {
    return {
      expression,
      parts,
      description: '',
      isValid: false,
      error: 'Invalid field value in cron expression',
    };
  }

  // Build description
  let desc = 'At ';

  // Time
  if (parts.minute === '*' && parts.hour === '*') {
    desc = 'Every minute';
  } else if (parts.minute === '*') {
    desc = `Every minute during hour ${hourVals.join(', ')}`;
  } else if (parts.hour === '*') {
    desc = `At minute ${minuteVals.join(', ')} of every hour`;
  } else {
    const times = [];
    for (const h of hourVals) {
      for (const m of minuteVals) {
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const ampm = h < 12 ? 'AM' : 'PM';
        times.push(`${hour12}:${m.toString().padStart(2, '0')} ${ampm}`);
      }
    }
    desc = `At ${times.slice(0, 3).join(', ')}${times.length > 3 ? ` (+${times.length - 3} more)` : ''}`;
  }

  // Day of week
  if (parts.dayOfWeek !== '*') {
    desc += `, ${describeField(parts.dayOfWeek, 'dow')}`;
  }

  // Day of month
  if (parts.dayOfMonth !== '*') {
    desc += `, on day ${dayVals.join(', ')} of the month`;
  }

  // Month
  if (parts.month !== '*') {
    desc += `, in ${describeField(parts.month, 'month')}`;
  }

  return {
    expression,
    parts,
    description: desc,
    isValid: true,
  };
}

export function getNextOccurrences(expression: string, count: number = 5, from: Date = new Date()): Date[] {
  const parts = parseCronExpression(expression);
  if (!parts) return [];

  const minuteVals = parseField(parts.minute, 0, 59);
  const hourVals = parseField(parts.hour, 0, 23);
  const dayVals = parseField(parts.dayOfMonth, 1, 31);
  const monthVals = parseField(parts.month, 1, 12);
  const dowVals = parseField(parts.dayOfWeek, 0, 6);

  if (!minuteVals || !hourVals || !dayVals || !monthVals || !dowVals) return [];

  const results: Date[] = [];
  const current = new Date(from);
  current.setSeconds(0, 0);
  current.setMinutes(current.getMinutes() + 1);

  const maxIterations = 366 * 24 * 60; // Max 1 year of minutes
  let iterations = 0;

  while (results.length < count && iterations < maxIterations) {
    iterations++;

    const month = current.getMonth() + 1;
    const day = current.getDate();
    const dow = current.getDay();
    const hour = current.getHours();
    const minute = current.getMinutes();

    const monthMatch = monthVals.includes(month);
    const dayMatch = dayVals.includes(day);
    const dowMatch = dowVals.includes(dow);
    const hourMatch = hourVals.includes(hour);
    const minuteMatch = minuteVals.includes(minute);

    // Day matches if either dayOfMonth or dayOfWeek matches (or both are *)
    const dayCondition = parts.dayOfMonth === '*' && parts.dayOfWeek === '*' ? true :
                         parts.dayOfMonth === '*' ? dowMatch :
                         parts.dayOfWeek === '*' ? dayMatch :
                         dayMatch || dowMatch;

    if (monthMatch && dayCondition && hourMatch && minuteMatch) {
      results.push(new Date(current));
    }

    current.setMinutes(current.getMinutes() + 1);
  }

  return results;
}

export function buildCronFromDescription(description: string): string | null {
  const lower = description.toLowerCase();

  // Common patterns
  if (lower.includes('every minute')) return '* * * * *';
  if (lower.includes('every hour')) return '0 * * * *';
  if (lower.includes('every day at midnight')) return '0 0 * * *';
  if (lower.includes('every day at noon')) return '0 12 * * *';

  // Parse "every X at Y"
  const everyAtMatch = lower.match(/every\s+(weekday|day|week|month)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (everyAtMatch) {
    let hour = parseInt(everyAtMatch[2], 10);
    const minute = everyAtMatch[3] ? parseInt(everyAtMatch[3], 10) : 0;
    const ampm = everyAtMatch[4];

    if (ampm?.toLowerCase() === 'pm' && hour < 12) hour += 12;
    if (ampm?.toLowerCase() === 'am' && hour === 12) hour = 0;

    const period = everyAtMatch[1].toLowerCase();
    if (period === 'weekday') return `${minute} ${hour} * * 1-5`;
    if (period === 'day') return `${minute} ${hour} * * *`;
    if (period === 'week') return `${minute} ${hour} * * 0`;
    if (period === 'month') return `${minute} ${hour} 1 * *`;
  }

  // Parse "at X:XX"
  const atMatch = lower.match(/at\s+(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (atMatch) {
    let hour = parseInt(atMatch[1], 10);
    const minute = parseInt(atMatch[2], 10);
    const ampm = atMatch[3];

    if (ampm?.toLowerCase() === 'pm' && hour < 12) hour += 12;
    if (ampm?.toLowerCase() === 'am' && hour === 12) hour = 0;

    return `${minute} ${hour} * * *`;
  }

  return null;
}
