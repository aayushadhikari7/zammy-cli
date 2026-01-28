export interface DateTimeInfo {
  iso: string;
  local: string;
  utc: string;
  unix: number;
  relative: string;
}

export interface DurationParts {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

const COMMON_TIMEZONES: Record<string, number> = {
  UTC: 0,
  GMT: 0,
  EST: -5,
  EDT: -4,
  CST: -6,
  CDT: -5,
  MST: -7,
  MDT: -6,
  PST: -8,
  PDT: -7,
  IST: 5.5,
  JST: 9,
  KST: 9,
  CET: 1,
  CEST: 2,
  AEST: 10,
  AEDT: 11,
};

export function getTimezoneOffset(tz: string): number | null {
  const upper = tz.toUpperCase();
  if (upper in COMMON_TIMEZONES) {
    return COMMON_TIMEZONES[upper];
  }

  // Try parsing as UTC+X or UTC-X
  const match = tz.match(/^UTC([+-])(\d{1,2})(?::?(\d{2}))?$/i);
  if (match) {
    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) / 60 : 0;
    return sign * (hours + minutes);
  }

  return null;
}

export function getTimezoneNames(): string[] {
  return Object.keys(COMMON_TIMEZONES);
}

export function parseDate(input: string): Date | null {
  if (!input || input === 'now') {
    return new Date();
  }

  // Unix timestamp
  if (/^\d{10,13}$/.test(input)) {
    const ts = parseInt(input, 10);
    return new Date(ts > 9999999999 ? ts : ts * 1000);
  }

  // ISO format or other parseable string
  const date = new Date(input);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}

export function formatInTimezone(date: Date, offsetHours: number): string {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const tzDate = new Date(utc + offsetHours * 3600000);
  return tzDate.toISOString().replace('T', ' ').replace('Z', '');
}

export function convertTimezone(date: Date, fromTz: string, toTz: string): Date | null {
  const fromOffset = getTimezoneOffset(fromTz);
  const toOffset = getTimezoneOffset(toTz);

  if (fromOffset === null || toOffset === null) {
    return null;
  }

  const utcTime = date.getTime() - fromOffset * 3600000;
  return new Date(utcTime + toOffset * 3600000);
}

export function parseDuration(input: string): DurationParts | null {
  const parts: DurationParts = {};
  const regex = /(\d+)\s*(y(?:ears?)?|mo(?:nths?)?|w(?:eeks?)?|d(?:ays?)?|h(?:ours?)?|m(?:in(?:utes?)?)?|s(?:ec(?:onds?)?)?)/gi;

  let match;
  let found = false;

  while ((match = regex.exec(input)) !== null) {
    found = true;
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    if (unit.startsWith('y')) parts.years = value;
    else if (unit.startsWith('mo')) parts.months = value;
    else if (unit.startsWith('w')) parts.weeks = value;
    else if (unit.startsWith('d')) parts.days = value;
    else if (unit.startsWith('h')) parts.hours = value;
    else if (unit.startsWith('m')) parts.minutes = value;
    else if (unit.startsWith('s')) parts.seconds = value;
  }

  return found ? parts : null;
}

export function addDuration(date: Date, duration: DurationParts): Date {
  const result = new Date(date);

  if (duration.years) result.setFullYear(result.getFullYear() + duration.years);
  if (duration.months) result.setMonth(result.getMonth() + duration.months);
  if (duration.weeks) result.setDate(result.getDate() + duration.weeks * 7);
  if (duration.days) result.setDate(result.getDate() + duration.days);
  if (duration.hours) result.setHours(result.getHours() + duration.hours);
  if (duration.minutes) result.setMinutes(result.getMinutes() + duration.minutes);
  if (duration.seconds) result.setSeconds(result.getSeconds() + duration.seconds);

  return result;
}

export function subtractDuration(date: Date, duration: DurationParts): Date {
  const negated: DurationParts = {};
  for (const [key, value] of Object.entries(duration)) {
    if (value !== undefined) {
      (negated as any)[key] = -value;
    }
  }
  return addDuration(date, negated);
}

export function diffDates(date1: Date, date2: Date): { days: number; hours: number; minutes: number; seconds: number; total: number } {
  const diff = Math.abs(date2.getTime() - date1.getTime());
  const totalSeconds = Math.floor(diff / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    total: totalSeconds,
  };
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const absDiff = Math.abs(diff);
  const future = diff < 0;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let result: string;
  if (seconds < 60) result = `${seconds} second${seconds !== 1 ? 's' : ''}`;
  else if (minutes < 60) result = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  else if (hours < 24) result = `${hours} hour${hours !== 1 ? 's' : ''}`;
  else if (days < 7) result = `${days} day${days !== 1 ? 's' : ''}`;
  else if (weeks < 4) result = `${weeks} week${weeks !== 1 ? 's' : ''}`;
  else if (months < 12) result = `${months} month${months !== 1 ? 's' : ''}`;
  else result = `${years} year${years !== 1 ? 's' : ''}`;

  return future ? `in ${result}` : `${result} ago`;
}

export function formatDate(date: Date, format: string): string {
  const pad = (n: number, len: number = 2) => n.toString().padStart(len, '0');

  const tokens: Record<string, string> = {
    YYYY: date.getFullYear().toString(),
    YY: date.getFullYear().toString().slice(-2),
    MM: pad(date.getMonth() + 1),
    M: (date.getMonth() + 1).toString(),
    DD: pad(date.getDate()),
    D: date.getDate().toString(),
    HH: pad(date.getHours()),
    H: date.getHours().toString(),
    hh: pad(date.getHours() % 12 || 12),
    h: (date.getHours() % 12 || 12).toString(),
    mm: pad(date.getMinutes()),
    m: date.getMinutes().toString(),
    ss: pad(date.getSeconds()),
    s: date.getSeconds().toString(),
    SSS: pad(date.getMilliseconds(), 3),
    A: date.getHours() < 12 ? 'AM' : 'PM',
    a: date.getHours() < 12 ? 'am' : 'pm',
  };

  let result = format;
  for (const [token, value] of Object.entries(tokens)) {
    result = result.replace(new RegExp(token, 'g'), value);
  }
  return result;
}

export function getDateTimeInfo(date: Date): DateTimeInfo {
  return {
    iso: date.toISOString(),
    local: date.toLocaleString(),
    utc: date.toUTCString(),
    unix: Math.floor(date.getTime() / 1000),
    relative: getRelativeTime(date),
  };
}
