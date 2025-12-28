# Zammy CLI

> Your slice-of-life terminal companion

<p align="center">
  <a href="https://github.com/aayushadhikari7/zammy-cli/actions/workflows/test.yml"><img src="https://github.com/aayushadhikari7/zammy-cli/actions/workflows/test.yml/badge.svg" alt="Tests"></a>
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
- **Enhanced Shell Commands** - Supercharged `!` commands with colors, icons, and extra features:
  - Colorized `ls` with file type icons and human-readable sizes
  - Syntax-highlighted `cat` for code files
  - Visual `tree`, `du` with progress bars, `diff` with colors
  - Directory bookmarks, command aliases, clipboard integration
  - Quick HTTP client, git status, timestamp converter, and more!
- **Beautiful ASCII Art** - Convert images to ASCII with multiple styles and edge detection
- **Rich UI** - Colorful output, box drawings, gradients, and Unicode symbols
- **Cross-Platform** - Works on Windows, macOS, and Linux
- **Custom Terminal Support** - Graceful fallback for non-TTY environments

## Installation

```bash
# Clone the repository
git clone https://github.com/aayushadhikari7/zammy-cli.git
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

### Running in Custom Terminals

If your terminal doesn't support interactive features, Zammy automatically falls back to simple mode:

```bash
zammy --simple  # Force simple mode
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

Styles available:
- `standard` - 10 character levels
- `detailed` - 70 characters for smooth gradients (default)
- `blocks` - Unicode block elements (░▒▓█)
- `simple` - Clean 5-level output
- `extended` - Maximum depth

**Figlet Fonts:**
```bash
/figlet Hello --font Slant
```

Available fonts: Standard, Big, Slant, Small, Banner, Block, Bubble, Digital, Mini, Script, Shadow, Speed

### Dev

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
| `!ls [-la]` | Colorized file listing with file type icons, sizes, and dates |
| `!tree` | Visual directory tree with icons and smart filtering |
| `!cat <file>` | View files with syntax highlighting for code |
| `!find <pattern>` | Find files matching pattern with colored results |
| `!grep <pattern>` | Search file contents with highlighted matches |
| `!du` | Disk usage with visual progress bars |
| `!diff <f1> <f2>` | Compare two files with colored diff output |
| `!wc <file>` | Word, line, and character counts |
| `!head <file>` | Show first N lines of a file |

### Navigation

| Command | Description |
|---------|-------------|
| `!cd <path>` | Change directory (supports `~` and `-`) |
| `!pwd` | Show current directory |
| `!bookmark save <name>` | Save current directory as bookmark |
| `!bookmark go <name>` | Jump to a saved bookmark |
| `!bookmark list` | List all bookmarks |
| `!bookmark del <name>` | Delete a bookmark |

### Developer Tools

| Command | Description |
|---------|-------------|
| `!git [status\|log\|branch]` | Enhanced git with colored, formatted output |
| `!json <file>` | Pretty print JSON with syntax highlighting |
| `!http GET <url>` | Quick HTTP requests with JSON auto-formatting |
| `!epoch [time]` | Convert between timestamps and dates |
| `!serve [port]` | Start a quick HTTP server |

### System

| Command | Description |
|---------|-------------|
| `!ip` | Show local and public IP addresses |
| `!ps` | Process list with formatted output |
| `!env [filter]` | View environment variables |
| `!clipboard copy <text>` | Copy text to clipboard |
| `!clipboard paste` | Show clipboard contents |
| `!clipboard file <path>` | Copy file contents to clipboard |
| `!notify <message>` | Send desktop notification |

### Utilities

| Command | Description |
|---------|-------------|
| `!alias add <name> <cmd>` | Create command shortcuts |
| `!alias list` | Show all aliases |
| `!alias run <name>` | Run a saved alias |
| `!watch <file>` | Watch file for changes (like tail -f) |
| `!clear` | Clear screen (preserves Zammy banner) |

### Cross-Platform Translation

Linux/macOS commands are automatically translated on Windows:
- `ls` → Enhanced colorized listing
- `cat` → Syntax-highlighted output
- `rm` → `del` / `rmdir`
- `cp` → `copy` / `xcopy`
- `mv` → `move`
- `grep` → Enhanced search with highlighting

## Interactive Features

### Command Browser

Type `/` or `!` to open an interactive command menu:

- **↑/↓** - Navigate through commands (scrollable list)
- **Tab** - Select and insert command
- **Escape** - Close menu
- Keep typing to filter commands by name
- Menu shows up to 6 items with scroll indicators

### Tab Completion

- Type `/asciiart @` + **Tab** → Autocompletes image files in current directory

### Example Session

```
zammy❯ /
  ❯ /help - Show all available commands
    /asciiart - Convert an image to ASCII art
    /calc - Calculate a math expression
    ...

zammy❯ /hash sha256 hello
╭────────────────────────────────────────────────────────────────────╮
│  🔒 HASH RESULT                                                    │
│  Algorithm: SHA256                                                 │
│  Hash: 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e7304...     │
╰────────────────────────────────────────────────────────────────────╯

zammy❯ /pomodoro start
  🍅 POMODORO STARTED 🍅
  Focus time! 25 minutes of deep work.
```

## Configuration

Zammy runs with sensible defaults:

- **Double Ctrl+C** - Required to exit (prevents accidental closure)
- **Current directory** - Zammy respects your working directory for shell commands
- **Persistent data** - Todos and history saved to `~/.zammy-todos.json` and `~/.zammy-history`

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
│   ├── index.ts              # Main entry, REPL loop
│   ├── cli.ts                # Command parser, shell execution
│   ├── commands/
│   │   ├── registry.ts       # Command registration system
│   │   ├── index.ts          # Auto-imports all categories
│   │   ├── utilities/        # Utility commands
│   │   │   ├── index.ts
│   │   │   ├── help.ts
│   │   │   ├── calc.ts
│   │   │   ├── password.ts
│   │   │   ├── stats.ts
│   │   │   ├── time.ts
│   │   │   ├── countdown.ts
│   │   │   ├── timer.ts
│   │   │   ├── todo.ts
│   │   │   ├── history.ts
│   │   │   └── exit.ts
│   │   ├── fun/              # Fun commands
│   │   │   ├── index.ts
│   │   │   ├── joke.ts
│   │   │   ├── quote.ts
│   │   │   ├── fortune.ts
│   │   │   ├── dice.ts
│   │   │   ├── flip.ts
│   │   │   └── pomodoro.ts
│   │   ├── creative/         # Creative commands
│   │   │   ├── index.ts
│   │   │   ├── asciiart.ts
│   │   │   ├── figlet.ts
│   │   │   ├── lorem.ts
│   │   │   └── color.ts
│   │   ├── dev/              # Developer commands
│   │   │   ├── index.ts
│   │   │   ├── hash.ts
│   │   │   ├── uuid.ts
│   │   │   └── encode.ts
│   │   └── info/             # Info commands
│   │       ├── index.ts
│   │       └── weather.ts
│   └── ui/
│       ├── banner.ts         # Welcome screen
│       ├── colors.ts         # Theme, symbols, box drawing
│       └── prompt.ts         # CLI prompt
├── dist/                     # Compiled output
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

1. Create a new file in the appropriate category folder (e.g., `src/commands/utilities/`):

```typescript
import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';

registerCommand({
  name: 'mycommand',
  description: 'Does something cool',
  usage: '/mycommand [options]',
  async execute(args: string[]) {
    console.log(theme.success('Hello from mycommand!'));
  },
});
```

2. Import it in the category's `index.ts`:

```typescript
import './mycommand.js';
```

3. Add it to the `categories` object in `help.ts` if needed.

4. Rebuild and run!

## License

MIT License - feel free to use, modify, and distribute.

---

<p align="center">
  Made with ❤️ and lots of ☕
</p>
