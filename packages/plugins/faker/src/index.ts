// Zammy Plugin: Faker
// Generate fake data for testing and development

interface PluginAPI {
  registerCommand(command: Command): void;
  ui: {
    theme: {
      primary: (text: string) => string;
      secondary: (text: string) => string;
      success: (text: string) => string;
      warning: (text: string) => string;
      error: (text: string) => string;
      dim: (text: string) => string;
      gradient: (text: string) => string;
    };
    symbols: {
      check: string;
      cross: string;
      warning: string;
      info: string;
      sparkles: string;
      arrow: string;
    };
    box: (content: string, options?: { title?: string; padding?: number }) => string;
  };
  log: {
    info: (message: string) => void;
  };
  context: {
    pluginName: string;
  };
}

interface Command {
  name: string;
  description: string;
  usage: string;
  execute: (args: string[]) => Promise<void>;
}

// ============ DATA POOLS ============

const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Lisa', 'Daniel', 'Nancy',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Aiden', 'Olivia', 'Ethan', 'Emma', 'Liam', 'Ava', 'Noah', 'Sophia', 'Lucas', 'Mia'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

const EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'protonmail.com', 'example.com', 'test.com', 'mail.com', 'email.com'
];

const STREET_NAMES = [
  'Main', 'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Washington', 'Lake',
  'Hill', 'Park', 'Forest', 'River', 'Spring', 'Valley', 'Sunset', 'Broadway'
];

const STREET_TYPES = ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Rd', 'Way', 'Ct', 'Pl'];

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
  'Fort Worth', 'Columbus', 'Charlotte', 'Seattle', 'Denver', 'Boston', 'Portland'
];

const STATES = [
  { name: 'California', abbr: 'CA' }, { name: 'Texas', abbr: 'TX' },
  { name: 'Florida', abbr: 'FL' }, { name: 'New York', abbr: 'NY' },
  { name: 'Pennsylvania', abbr: 'PA' }, { name: 'Illinois', abbr: 'IL' },
  { name: 'Ohio', abbr: 'OH' }, { name: 'Georgia', abbr: 'GA' },
  { name: 'North Carolina', abbr: 'NC' }, { name: 'Michigan', abbr: 'MI' },
  { name: 'Washington', abbr: 'WA' }, { name: 'Arizona', abbr: 'AZ' },
  { name: 'Massachusetts', abbr: 'MA' }, { name: 'Colorado', abbr: 'CO' }
];

const COMPANY_PREFIXES = [
  'Tech', 'Global', 'Innovative', 'Premier', 'Elite', 'Advanced', 'Dynamic',
  'Strategic', 'Creative', 'Digital', 'Smart', 'Next', 'Pro', 'Prime', 'Alpha'
];

const COMPANY_SUFFIXES = [
  'Solutions', 'Systems', 'Technologies', 'Industries', 'Enterprises', 'Corp',
  'Inc', 'Labs', 'Group', 'Partners', 'Dynamics', 'Innovations', 'Services', 'Co'
];

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
];

// ============ GENERATORS ============

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateName(): { firstName: string; lastName: string; fullName: string } {
  const firstName = randomItem(FIRST_NAMES);
  const lastName = randomItem(LAST_NAMES);
  return { firstName, lastName, fullName: `${firstName} ${lastName}` };
}

function generateEmail(name?: { firstName: string; lastName: string }): string {
  const { firstName, lastName } = name || generateName();
  const domain = randomItem(EMAIL_DOMAINS);
  const separators = ['.', '_', ''];
  const separator = randomItem(separators);
  const suffix = Math.random() > 0.5 ? randomInt(1, 99).toString() : '';
  return `${firstName.toLowerCase()}${separator}${lastName.toLowerCase()}${suffix}@${domain}`;
}

function generatePhone(): string {
  const areaCode = randomInt(200, 999);
  const prefix = randomInt(200, 999);
  const line = randomInt(1000, 9999);
  return `(${areaCode}) ${prefix}-${line}`;
}

function generateAddress(): {
  street: string;
  city: string;
  state: string;
  stateAbbr: string;
  zip: string;
  full: string;
} {
  const number = randomInt(100, 9999);
  const streetName = randomItem(STREET_NAMES);
  const streetType = randomItem(STREET_TYPES);
  const street = `${number} ${streetName} ${streetType}`;
  const city = randomItem(CITIES);
  const stateInfo = randomItem(STATES);
  const zip = randomInt(10000, 99999).toString();

  return {
    street,
    city,
    state: stateInfo.name,
    stateAbbr: stateInfo.abbr,
    zip,
    full: `${street}, ${city}, ${stateInfo.abbr} ${zip}`
  };
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateCreditCard(): {
  number: string;
  expiry: string;
  cvv: string;
  type: string;
  formatted: string;
} {
  const types = [
    { name: 'Visa', prefix: '4', length: 16 },
    { name: 'Mastercard', prefix: '5', length: 16 },
    { name: 'Amex', prefix: '37', length: 15 },
    { name: 'Discover', prefix: '6011', length: 16 }
  ];

  const type = randomItem(types);

  // Generate card number with Luhn algorithm
  let digits = type.prefix.split('').map(Number);
  while (digits.length < type.length - 1) {
    digits.push(randomInt(0, 9));
  }

  // Calculate Luhn check digit
  const reversed = [...digits].reverse();
  let sum = 0;
  for (let i = 0; i < reversed.length; i++) {
    let digit = reversed[i];
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  digits.push(checkDigit);

  const number = digits.join('');
  const month = randomInt(1, 12).toString().padStart(2, '0');
  const year = (new Date().getFullYear() + randomInt(1, 5)).toString().slice(-2);
  const cvv = type.name === 'Amex'
    ? randomInt(1000, 9999).toString()
    : randomInt(100, 999).toString();

  // Format number with spaces
  const formatted = type.name === 'Amex'
    ? `${number.slice(0, 4)} ${number.slice(4, 10)} ${number.slice(10)}`
    : `${number.slice(0, 4)} ${number.slice(4, 8)} ${number.slice(8, 12)} ${number.slice(12)}`;

  return {
    number,
    expiry: `${month}/${year}`,
    cvv,
    type: type.name,
    formatted
  };
}

function generateCompany(): string {
  const prefix = randomItem(COMPANY_PREFIXES);
  const suffix = randomItem(COMPANY_SUFFIXES);
  return `${prefix} ${suffix}`;
}

function generateDate(
  start: Date = new Date(2000, 0, 1),
  end: Date = new Date()
): { date: Date; iso: string; formatted: string } {
  const timestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  const date = new Date(timestamp);
  return {
    date,
    iso: date.toISOString(),
    formatted: date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };
}

function generateLorem(sentences: number = 3): string {
  const result: string[] = [];
  for (let i = 0; i < sentences; i++) {
    const wordCount = randomInt(8, 15);
    const words: string[] = [];
    for (let j = 0; j < wordCount; j++) {
      words.push(randomItem(LOREM_WORDS));
    }
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    result.push(words.join(' ') + '.');
  }
  return result.join(' ');
}

function generateJson(template: string): string {
  const replacements: Record<string, () => string> = {
    '{{name}}': () => generateName().fullName,
    '{{firstName}}': () => generateName().firstName,
    '{{lastName}}': () => generateName().lastName,
    '{{email}}': () => generateEmail(),
    '{{phone}}': () => generatePhone(),
    '{{address}}': () => generateAddress().full,
    '{{street}}': () => generateAddress().street,
    '{{city}}': () => generateAddress().city,
    '{{state}}': () => generateAddress().stateAbbr,
    '{{zip}}': () => generateAddress().zip,
    '{{uuid}}': () => generateUUID(),
    '{{company}}': () => generateCompany(),
    '{{date}}': () => generateDate().iso,
    '{{number}}': () => randomInt(1, 1000).toString(),
    '{{bool}}': () => (Math.random() > 0.5).toString(),
  };

  let result = template;
  for (const [placeholder, generator] of Object.entries(replacements)) {
    const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
    result = result.replace(regex, generator);
  }

  return result;
}

// ============ PLUGIN ============

const plugin = {
  activate(api: PluginAPI) {
    const { theme, symbols } = api.ui;

    api.registerCommand({
      name: 'fake',
      description: 'Generate fake data for testing',
      usage: '/fake <type> [options]\n\n  Types: email, name, phone, address, uuid, card, company, date, lorem, json',
      async execute(args: string[]) {
        const type = args[0]?.toLowerCase();

        if (!type) {
          console.log('');
          console.log(`  ${symbols.sparkles} ${theme.gradient('FAKE DATA GENERATOR')}`);
          console.log('');
          console.log(`  ${theme.dim('Usage:')} /fake <type> [options]`);
          console.log('');
          console.log(`  ${theme.dim('Types:')}`);
          console.log(`    ${theme.primary('email')}     ${theme.dim('Random email address')}`);
          console.log(`    ${theme.primary('name')}      ${theme.dim('Random full name')}`);
          console.log(`    ${theme.primary('phone')}     ${theme.dim('Random phone number')}`);
          console.log(`    ${theme.primary('address')}   ${theme.dim('Random street address')}`);
          console.log(`    ${theme.primary('uuid')}      ${theme.dim('Random UUID')}`);
          console.log(`    ${theme.primary('card')}      ${theme.dim('Fake credit card')}`);
          console.log(`    ${theme.primary('company')}   ${theme.dim('Random company name')}`);
          console.log(`    ${theme.primary('date')}      ${theme.dim('Random date')}`);
          console.log(`    ${theme.primary('lorem')}     ${theme.dim('Lorem ipsum text')}`);
          console.log(`    ${theme.primary('json')}      ${theme.dim('JSON with placeholders')}`);
          console.log('');
          return;
        }

        console.log('');

        switch (type) {
          case 'email': {
            const email = generateEmail();
            console.log(`  ${symbols.check} ${theme.success('Email:')} ${theme.primary(email)}`);
            break;
          }

          case 'name': {
            const name = generateName();
            console.log(`  ${symbols.check} ${theme.success('Name:')} ${theme.primary(name.fullName)}`);
            console.log(`  ${theme.dim('First:')} ${name.firstName}  ${theme.dim('Last:')} ${name.lastName}`);
            break;
          }

          case 'phone': {
            const phone = generatePhone();
            console.log(`  ${symbols.check} ${theme.success('Phone:')} ${theme.primary(phone)}`);
            break;
          }

          case 'address': {
            const addr = generateAddress();
            console.log(`  ${symbols.check} ${theme.success('Address:')}`);
            console.log(`  ${theme.primary(addr.street)}`);
            console.log(`  ${addr.city}, ${addr.stateAbbr} ${addr.zip}`);
            break;
          }

          case 'uuid': {
            const uuid = generateUUID();
            console.log(`  ${symbols.check} ${theme.success('UUID:')} ${theme.primary(uuid)}`);
            break;
          }

          case 'card': {
            const card = generateCreditCard();
            console.log(`  ${symbols.check} ${theme.success('Credit Card:')}`);
            console.log(`  ${theme.dim('Type:')}   ${theme.primary(card.type)}`);
            console.log(`  ${theme.dim('Number:')} ${theme.primary(card.formatted)}`);
            console.log(`  ${theme.dim('Expiry:')} ${card.expiry}  ${theme.dim('CVV:')} ${card.cvv}`);
            console.log('');
            console.log(`  ${theme.warning(`${symbols.warning} For testing only - not a real card`)}`);
            break;
          }

          case 'company': {
            const company = generateCompany();
            console.log(`  ${symbols.check} ${theme.success('Company:')} ${theme.primary(company)}`);
            break;
          }

          case 'date': {
            const date = generateDate();
            console.log(`  ${symbols.check} ${theme.success('Date:')} ${theme.primary(date.formatted)}`);
            console.log(`  ${theme.dim('ISO:')} ${date.iso}`);
            break;
          }

          case 'lorem': {
            const count = parseInt(args[1]) || 3;
            const text = generateLorem(count);
            console.log(`  ${symbols.check} ${theme.success(`Lorem Ipsum (${count} sentences):`)}`);
            console.log('');
            // Word wrap at ~60 chars
            const words = text.split(' ');
            let line = '  ';
            for (const word of words) {
              if (line.length + word.length > 65) {
                console.log(line);
                line = '  ';
              }
              line += word + ' ';
            }
            if (line.trim()) console.log(line);
            break;
          }

          case 'json': {
            const template = args.slice(1).join(' ');
            if (!template) {
              console.log(`  ${symbols.warning} ${theme.warning('Usage:')} /fake json <template>`);
              console.log('');
              console.log(`  ${theme.dim('Example:')}`);
              console.log(`  /fake json {"name": "{{name}}", "email": "{{email}}"}`);
              console.log('');
              console.log(`  ${theme.dim('Placeholders:')} {{name}}, {{email}}, {{phone}}, {{address}},`);
              console.log(`               {{uuid}}, {{company}}, {{date}}, {{number}}, {{bool}}`);
              break;
            }

            try {
              const result = generateJson(template);
              const parsed = JSON.parse(result);
              const pretty = JSON.stringify(parsed, null, 2);
              console.log(`  ${symbols.check} ${theme.success('Generated JSON:')}`);
              console.log('');
              for (const line of pretty.split('\n')) {
                console.log(`  ${theme.primary(line)}`);
              }
            } catch {
              console.log(`  ${symbols.cross} ${theme.error('Invalid JSON template')}`);
            }
            break;
          }

          default:
            console.log(`  ${symbols.cross} ${theme.error(`Unknown type: ${type}`)}`);
            console.log(`  ${theme.dim('Run /fake to see available types')}`);
        }

        console.log('');
      }
    });

    api.log.info('Faker plugin activated');
  }
};

export default plugin;
