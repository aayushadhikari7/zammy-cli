<div align="center">

# Zammy CLI

**A feature-packed CLI with utilities, dev tools, and a bit of fun**

[![Tests](https://github.com/aayushadhikari7/zammy-cli/actions/workflows/test.yml/badge.svg)](https://github.com/aayushadhikari7/zammy-cli/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/zammy.svg)](https://www.npmjs.com/package/zammy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

```
███████╗ █████╗ ███╗   ███╗███╗   ███╗██╗   ██╗
╚══███╔╝██╔══██╗████╗ ████║████╗ ████║╚██╗ ██╔╝
  ███╔╝ ███████║██╔████╔██║██╔████╔██║ ╚████╔╝
 ███╔╝  ██╔══██║██║╚██╔╝██║██║╚██╔╝██║  ╚██╔╝
███████╗██║  ██║██║ ╚═╝ ██║██║ ╚═╝ ██║   ██║
╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝   ╚═╝
```

A feature-packed CLI that combines utilities, dev tools, and a bit of fun into an interactive terminal experience.

[Features](#features) • [Installation](#installation) • [Commands](#commands) • [Contributing](#contributing)

</div>

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [Utilities](#utilities)
  - [Fun](#fun)
  - [Creative](#creative)
  - [Developer Tools](#developer-tools)
  - [Info](#info)
- [Enhanced Shell Commands](#enhanced-shell-commands)
- [Interactive Features](#interactive-features)
- [Configuration](#configuration)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Interactive Command Menu** — Type `/` to browse all commands with arrow key navigation
- **Tab Autocomplete** — Quick command completion with Tab key
- **Enhanced Shell Commands** — Supercharged `!` commands with colors, icons, and extra features
- **Beautiful ASCII Art** — Convert images to ASCII with multiple styles and edge detection
- **Rich UI** — Colorful output, box drawings, gradients, and Unicode symbols
- **Cross-Platform** — Works on Windows, macOS, and Linux
- **Fully Tested** — Comprehensive test suite with 150+ unit tests

## Installation

### From npm

```bash
npm install -g zammy
```

### From Source

```bash
git clone https://github.com/aayushadhikari7/zammy-cli.git
cd zammy-cli
npm install
npm run build
npm start
```

### Development Installation

```bash
npm link
zammy
```

## Quick Start

```bash
# Start Zammy
zammy

# Check version
zammy --version

# Force simple mode (for non-TTY terminals)
zammy --simple
```

Once inside Zammy:

```
zammy❯ /help              # See all commands
zammy❯ /calc 2^10         # Quick math
zammy❯ /password 16       # Generate secure password
zammy❯ !ls                # Enhanced file listing
zammy❯ /asciiart @img.png # Convert image to ASCII
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
| `/timer [start\|stop\|lap]` | Stopwatch timer |
| `/todo [add\|done\|rm]` | Persistent todo list |
| `/history [count\|clear]` | Command history |

### Fun

| Command | Description |
|---------|-------------|
| `/joke` | Get a random programming joke |
| `/quote` | Get an inspirational quote |
| `/fortune` | Get your fortune told (with lucky numbers!) |
| `/dice [count] [sides]` | Roll dice with ASCII art |
| `/flip [count]` | Flip coins with visual results |
| `/pomodoro [start\|stop\|status]` | Pomodoro timer (25/5 technique) |

### Creative

| Command | Description |
|---------|-------------|
| `/asciiart <image>` | Convert images to ASCII art |
| `/figlet <text>` | Generate ASCII art text |
| `/lorem [paragraphs] [sentences]` | Generate Lorem Ipsum text |
| `/color <hex\|rgb\|random>` | Color converter with preview |

**ASCII Art Options:**

```bash
/asciiart @photo.png --width 100 --style detailed --edges
```

Available styles: `standard`, `detailed` (default), `blocks`, `simple`, `extended`

**Figlet Fonts:**

```bash
/figlet Hello --font Slant
```

Available fonts: Standard, Big, Slant, Small, Banner, Block, Bubble, Digital, Mini, Script, Shadow, Speed

### Developer Tools

| Command | Description |
|---------|-------------|
| `/hash <algo> <text>` | Hash text (md5, sha1, sha256, sha512) |
| `/uuid [count]` | Generate UUID(s) |
| `/encode <method> <encode\|decode> <text>` | Encode/decode (base64, url, hex) |

### Info

| Command | Description |
|---------|-------------|
| `/weather [city]` | Get current weather for a location |

## Enhanced Shell Commands

Zammy provides **supercharged shell commands** that go beyond what a standard terminal offers. Prefix commands with `!`:

### File Operations

| Command | Description |
|---------|-------------|
| `!ls [-la]` | Colorized file listing with file type icons and sizes |
| `!tree` | Visual directory tree with icons |
| `!cat <file>` | View files with syntax highlighting |
| `!find <pattern>` | Find files with colored results |
| `!grep <pattern>` | Search contents with highlighted matches |
| `!du` | Disk usage with visual progress bars |
| `!diff <f1> <f2>` | Compare files with colored output |

### Navigation

| Command | Description |
|---------|-------------|
| `!cd <path>` | Change directory (supports `~` and `-`) |
| `!pwd` | Show current directory |
| `!bookmark save/go/list/del` | Directory bookmarks |

### Developer Tools

| Command | Description |
|---------|-------------|
| `!git [status\|log\|branch]` | Enhanced git with colors |
| `!json <file>` | Pretty print JSON |
| `!http GET <url>` | Quick HTTP requests |
| `!epoch [time]` | Timestamp converter |
| `!serve [port]` | Quick HTTP server |

### System

| Command | Description |
|---------|-------------|
| `!ip` | Show local and public IP |
| `!ps` | Process list |
| `!env [filter]` | Environment variables |
| `!clipboard copy/paste/file` | Clipboard operations |
| `!notify <message>` | Desktop notification |

### Cross-Platform

Linux/macOS commands are automatically translated on Windows:
- `ls` → Enhanced colorized listing
- `cat` → Syntax-highlighted output
- `rm`, `cp`, `mv` → Windows equivalents
- `grep` → Enhanced search

## Interactive Features

### Command Browser

Type `/` or `!` to open an interactive command menu:

- **↑/↓** — Navigate through commands
- **Tab** — Select and insert command
- **Escape** — Close menu
- Type to filter commands

### Tab Completion

```bash
zammy❯ /asciiart @     # Press Tab to autocomplete image files
```

## Configuration

Zammy runs with sensible defaults:

- **Double Ctrl+C** — Required to exit (prevents accidental closure)
- **Current directory** — Respects your working directory
- **Persistent data** — Saved to `~/.zammy-todos.json` and `~/.zammy-history`

## Development

```bash
# Install dependencies
npm install

# Development mode (watch)
npm run dev

# Build
npm run build

# Run tests
npm test

# Run tests once
npm run test:run
```

### Project Structure

```
zammy-cli/
├── src/
│   ├── index.ts          # Main entry, REPL loop
│   ├── cli.ts            # Command parser, shell execution
│   ├── commands/         # CLI command definitions
│   │   ├── registry.ts   # Command registration
│   │   ├── utilities/    # Utility commands
│   │   ├── fun/          # Fun commands
│   │   ├── creative/     # Creative commands
│   │   ├── dev/          # Developer commands
│   │   └── info/         # Info commands
│   ├── handlers/         # Business logic (testable)
│   │   ├── dev/          # Hash, UUID, encode logic
│   │   ├── utilities/    # Calc, password, stats logic
│   │   ├── fun/          # Dice, flip, fortune logic
│   │   └── creative/     # Lorem, color logic
│   └── ui/               # UI components
│       ├── banner.ts     # Welcome screen
│       ├── colors.ts     # Theme, symbols
│       └── prompt.ts     # CLI prompt
├── dist/                 # Compiled output
└── package.json
```

### Adding New Commands

1. Create handler in `src/handlers/<category>/`:

```typescript
// src/handlers/utilities/myhandler.ts
export function myFunction(input: string): string {
  return `Processed: ${input}`;
}
```

2. Create command in `src/commands/<category>/`:

```typescript
// src/commands/utilities/mycommand.ts
import { registerCommand } from '../registry.js';
import { myFunction } from '../../handlers/utilities/myhandler.js';

registerCommand({
  name: 'mycommand',
  description: 'Does something cool',
  usage: '/mycommand <input>',
  async execute(args: string[]) {
    console.log(myFunction(args[0]));
  },
});
```

3. Import in category's `index.ts`
4. Rebuild and run!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**[Back to top](#zammy-cli)**

Made with TypeScript and Node.js

</div>
