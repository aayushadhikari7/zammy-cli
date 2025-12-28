# Zammy CLI

> Your slice-of-life terminal companion

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
</p>

```
███████╗ █████╗ ███╗   ███╗███╗   ███╗██╗   ██╗
╚══███╔╝██╔══██╗████╗ ████║████╗ ████║╚██╗ ██╔╝
  ███╔╝ ███████║██╔████╔██║██╔████╔██║ ╚████╔╝
 ███╔╝  ██╔══██║██║╚██╔╝██║██║╚██╔╝██║  ╚██╔╝
███████╗██║  ██║██║ ╚═╝ ██║██║ ╚═╝ ██║   ██║
╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝   ╚═╝
```

Zammy is a delightful, feature-rich terminal companion built with TypeScript. It combines utility tools, fun commands, and beautiful ASCII art into an interactive CLI experience.

## Features

- **Interactive Command Menu** - Type `/` to browse all commands with arrow key navigation
- **Tab Autocomplete** - Quick command completion with Tab key
- **Shell Integration** - Run shell commands with `!` prefix (with Linux-to-Windows translation)
- **Beautiful ASCII Art** - Convert images to ASCII with multiple styles and edge detection
- **Rich UI** - Colorful output, box drawings, gradients, and Unicode symbols
- **Cross-Platform** - Works on Windows, macOS, and Linux

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/zammy-cli.git
cd zammy-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run Zammy
npm start
```

### Global Installation (Development)

```bash
npm link
zammy
```

## Commands

### Utilities

| Command | Description |
|---------|-------------|
| `/help [cmd]` | Show all commands or get help for a specific command |
| `/exit` | Exit Zammy |
| `/calc <expr>` | Calculate math expressions (`2+2`, `2^8`, `100%7`) |
| `/password [len]` | Generate secure passwords with strength indicator |
| `/stats` | Display system statistics (CPU, memory, uptime) |
| `/time` | Show current time with ASCII clock |
| `/countdown <time>` | Start a countdown timer (`30s`, `5m`, `1h30m`) |

### Fun

| Command | Description |
|---------|-------------|
| `/joke` | Get a random programming joke |
| `/quote` | Get an inspirational quote |
| `/fortune` | Get your fortune told (with lucky numbers!) |
| `/dice [count] [sides]` | Roll dice with ASCII art |
| `/flip [count]` | Flip coins with visual results |

### Creative

| Command | Description |
|---------|-------------|
| `/asciiart <image>` | Convert images to ASCII art |

**ASCII Art Options:**
```bash
/asciiart @photo.png --width 100 --style detailed --edges
```

Styles available:
- `standard` - 10 character levels
- `detailed` - 70 characters for smooth gradients (default)
- `blocks` - Unicode block elements (░▒▓█)
- `simple` - Clean 5-level output
- `extended` - Maximum depth

Additional flags:
- `--edges` - Enable Sobel edge detection
- `--invert` - Invert for light backgrounds
- `--contrast N` - Adjust contrast (-1 to 1)

### Info

| Command | Description |
|---------|-------------|
| `/weather [city]` | Get current weather for a location |

## Shell Commands

Prefix any command with `!` to run it in the shell:

```bash
!ls              # List files (auto-translates to 'dir' on Windows)
!cd folder       # Change directory
!pwd             # Print working directory
!cat file.txt    # Display file contents
!clear           # Clear screen (preserves Zammy banner)
```

**Linux/macOS commands are automatically translated on Windows:**
- `ls` → `dir`
- `cat` → `type`
- `rm` → `del` / `rmdir`
- `cp` → `copy` / `xcopy`
- `mv` → `move`
- `grep` → `findstr`
- `which` → `where`

## Interactive Features

### Command Browser

Type `/` or `!` to open an interactive command menu:

- **↑/↓** - Navigate through commands
- **Tab** or **Enter** - Select command
- **Escape** - Close menu
- Keep typing to filter commands

### Tab Completion

- Type `/asciiart @` + **Tab** → Autocompletes image files in current directory

### Example Session

```
zammy> /
  ❯ /help - Show all available commands
    /asciiart - Convert an image to ASCII art
    /calc - Calculate a math expression
    ...

zammy> !
  ❯ !ls - List directory contents
    !cd - Change directory
    !pwd - Print working directory
    ...

zammy> /calc 2^10
  2^10 = 1,024
```

## Configuration

Zammy runs with sensible defaults, but you can customize:

- **Double Ctrl+C** - Required to exit (prevents accidental closure)
- **Current directory** - Zammy respects your working directory for shell commands

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Build Tool**: tsup
- **Image Processing**: Jimp
- **ASCII Art**: Figlet
- **Colors**: Chalk

## Project Structure

```
zammy-cli/
├── src/
│   ├── index.ts          # Main entry, REPL loop
│   ├── cli.ts            # Command parser, shell execution
│   ├── commands/
│   │   ├── registry.ts   # Command registration system
│   │   ├── index.ts      # Auto-imports all commands
│   │   ├── help.ts
│   │   ├── asciiart.ts
│   │   ├── calc.ts
│   │   ├── dice.ts
│   │   ├── flip.ts
│   │   ├── password.ts
│   │   ├── stats.ts
│   │   ├── time.ts
│   │   ├── countdown.ts
│   │   ├── fortune.ts
│   │   ├── quote.ts
│   │   ├── joke.ts
│   │   ├── weather.ts
│   │   ├── clear.ts
│   │   └── exit.ts
│   └── ui/
│       ├── banner.ts     # Welcome screen
│       ├── colors.ts     # Theme, symbols, box drawing
│       └── prompt.ts     # CLI prompt
├── dist/                 # Compiled output
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## Development

```bash
# Install dependencies
npm install

# Development mode (watch)
npm run dev

# Build for production
npm run build

# Run after build
npm start
```

### Adding New Commands

1. Create a new file in `src/commands/`:

```typescript
import { registerCommand } from './registry.js';
import { theme, symbols } from '../ui/colors.js';

registerCommand({
  name: 'mycommand',
  description: 'Does something cool',
  usage: '/mycommand [options]',
  async execute(args: string[]) {
    console.log(theme.success('Hello from mycommand!'));
  },
});
```

2. Import it in `src/commands/index.ts`:

```typescript
import './mycommand.js';
```

3. Rebuild and run!

## License

MIT License - feel free to use, modify, and distribute.

---

<p align="center">
  Made with ❤️ and lots of ☕
</p>
