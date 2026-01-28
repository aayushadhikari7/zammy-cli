<div align="center">

# Zammy CLI

**Stop juggling 14 dev tools. Zammy has them all — plus a friendly purple slime.**

[![npm version](https://img.shields.io/npm/v/zammy.svg)](https://www.npmjs.com/package/zammy)
[![npm downloads](https://img.shields.io/npm/dm/zammy.svg)](https://www.npmjs.com/package/zammy)
[![Tests](https://github.com/aayushadhikari7/zammy-cli/actions/workflows/test.yml/badge.svg)](https://github.com/aayushadhikari7/zammy-cli/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

```
███████╗ █████╗ ███╗   ███╗███╗   ███╗██╗   ██╗
╚══███╔╝██╔══██╗████╗ ████║████╗ ████║╚██╗ ██╔╝
  ███╔╝ ███████║██╔████╔██║██╔████╔██║ ╚████╔╝
 ███╔╝  ██╔══██║██║╚██╔╝██║██║╚██╔╝██║  ╚██╔╝
███████╗██║  ██║██║ ╚═╝ ██║██║ ╚═╝ ██║   ██║
╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝   ╚═╝
```

An all-in-one CLI that combines dev utilities, productivity tools, and a mascot that actually cares about you.

[Why Zammy?](#why-zammy) • [Install](#installation) • [Commands](#commands) • [Plugins](#plugin-system) • [Contributing](#contributing)

</div>

---

## Why Zammy?

**70% of developers struggle with remembering terminal commands.** We built Zammy to fix that.

| The Problem | Zammy's Solution |
|-------------|------------------|
| Juggling 14+ different tools | Everything in one place |
| Forgetting command syntax | Interactive menu + autocomplete |
| Context switching kills focus | Never leave your terminal |
| Terminals feel cold & lifeless | Meet your new CLI companion |
| Windows always feels like an afterthought | First-class cross-platform support |

### What Zammy Replaces

```
Before Zammy                          With Zammy
─────────────────────────────────────────────────────────
Open browser → hash generator         /hash sha256 mytext
Switch to Postman for API test        !http GET api.com/users
Open separate todo app                /todo add "Fix bug"
Google "how to base64 encode"         /encode base64 hello
Find UUID generator website           /uuid
Look up git status flags              !git status
```

---

## Demo

![Zammy CLI Demo](assets/zammy.gif)

**Try these first:**
```bash
zammy              # Start Zammy
/joke              # Get a programming joke
/zammy excited     # See Zammy get excited
/asciiart @photo.png  # Turn any image into ASCII art
```

---

## Installation

```bash
npm install -g zammy
```

That's it. No config files. No setup wizard. Just run `zammy` and go.

### Requirements
- Node.js 18.0.0 or higher
- Works on Windows, macOS, and Linux

---

## Quick Start

```bash
# Start Zammy
zammy

# Once inside:
zammy❯ /help              # See all commands
zammy❯ /calc 2^10         # Quick math → 1024
zammy❯ /password 16       # Generate secure password
zammy❯ !ls                # Enhanced file listing with icons
zammy❯ !git status        # Pretty git status
```

### Command Prefixes

| Prefix | Type | Example |
|--------|------|---------|
| `/` | Zammy commands | `/help`, `/joke`, `/hash` |
| `!` | Enhanced shell | `!ls`, `!git`, `!http` |
| (none) | Chat with Zammy | `thanks`, `wow`, `:(` |

---

## Features

### Meet Zammy — Your CLI Companion

Zammy isn't just a command runner. It's a character that reacts to you:

- **Blinks** when you're idle (it's watching!)
- **Celebrates** when you say "thanks" or "awesome"
- **Shows sympathy** when you type "ugh" or ":("
- **Has 9 moods**: happy, excited, love, sleepy, thinking, surprised, sad, wink, angry

```bash
/zammy moods    # See all moods
/zammy excited  # Make Zammy excited
```

### Interactive Command Menu

Type `/` to browse commands with arrow keys:
- **↑/↓** Navigate
- **Tab/Enter** Select
- **Type** to filter
- **Escape** to close

### Beautiful Output

Everything is styled with colors, icons, and proper formatting:
- Syntax-highlighted code viewing
- Progress bars for disk usage
- Box-drawn tables and results
- File icons for 40+ file types

---

## Commands

### Utilities

| Command | Description |
|---------|-------------|
| `/help [cmd]` | Show all commands or help for specific command |
| `/calc <expr>` | Math expressions (`2+2`, `2^8`, `sqrt(144)`) |
| `/password [len]` | Generate secure password with strength meter |
| `/stats` | System info (CPU, memory, uptime) |
| `/time` | Current time with ASCII clock |
| `/countdown <time>` | Countdown timer (`30s`, `5m`, `1h30m`) |
| `/timer` | Stopwatch with lap support |
| `/todo` | Persistent todo list |
| `/history` | Command history |
| `/env [name]` | View environment variables |
| `/size [path]` | Analyze file/folder sizes |
| `/config` | Manage settings (show, set, reset, edit) |
| `/alias` | Persistent command aliases (add, remove, list) |
| `/datetime` | Timezone conversions, date math, formatting |
| `/text` | Text processing (sort, uniq, upper, lower, replace) |
| `/envfile` | Manage .env files (get, set, diff, template) |
| `/exit` | Exit Zammy |

### Developer Tools

| Command | Description |
|---------|-------------|
| `/hash <algo> <text>` | Hash text (md5, sha1, sha256, sha512) |
| `/uuid [count]` | Generate UUIDs |
| `/encode <type> <text>` | Encode/decode (base64, url, html) |
| `/json <action>` | JSON tools (validate, format, query) |
| `/request <method> <url>` | Make HTTP requests (no curl needed) |
| `/diff <file1> <file2>` | Compare two files |
| `/base <number>` | Convert between binary, octal, decimal, hex |
| `/regex <pattern> <input>` | Test regex patterns with match highlighting |
| `/cron <expression>` | Parse cron expressions, show next runs |
| `/changelog` | Generate changelog from git commits |

### Fun

| Command | Description |
|---------|-------------|
| `/zammy [mood]` | Interact with Zammy |
| `/joke` | Random programming joke |
| `/quote` | Inspirational quote |
| `/fortune` | Get your fortune (with lucky numbers!) |
| `/dice [n] [sides]` | Roll dice with ASCII art |
| `/flip [count]` | Flip coins |
| `/pomodoro` | 25/5 Pomodoro timer |
| `/motivate` | Programming quotes, tips & affirmations |

### Creative

| Command | Description |
|---------|-------------|
| `/asciiart @<image>` | Convert images to ASCII art |
| `/figlet <text>` | Generate ASCII text art |
| `/lorem [n]` | Lorem ipsum generator |
| `/color <hex>` | Color converter & preview |

### Info

| Command | Description |
|---------|-------------|
| `/weather [city]` | Current weather |

> **Want IP & port tools?** Install the network plugins:
> - `/plugin install zammy-plugin-network` for `/net ip`, `/net ping`, `/net dns`, `/net speed`
> - `/plugin install zammy-plugin-port` for `/port list`, `/port kill`, `/port check`

---

## Enhanced Shell Commands

Prefix any command with `!` for enhanced versions:

### File Operations
```bash
!ls              # Colorized listing with icons
!tree            # Directory tree visualization
!cat file.js     # Syntax-highlighted file view
!find *.ts       # Find files with colors
!grep pattern    # Search with highlighted matches
!du              # Disk usage with progress bars
```

### Developer Tools
```bash
!git status      # Pretty git with branch & file status
!git log         # Formatted commit history
!json data.json  # Pretty-print JSON
!http GET url    # Quick HTTP requests
!serve 3000      # Start HTTP server
!epoch           # Timestamp converter
```

### System
```bash
!ip              # Local + public IP
!ps              # Process list
!env             # Environment variables
!clipboard copy  # Clipboard operations
!notify "Done!"  # Desktop notification
```

### Navigation
```bash
!cd ~/projects       # Change directory
!bookmark save work  # Save current dir as "work"
!bookmark go work    # Jump to "work"
```

---

## Plugin System

Zammy is extensible through plugins. Install community plugins or create your own.

### Managing Plugins

```bash
/plugin list                    # Show installed plugins
/plugin install ./my-plugin     # Install from local directory
/plugin install zammy-plugin-x  # Install from npm
/plugin install github:user/repo # Install from GitHub
/plugin remove plugin-name      # Remove a plugin
```

### Official Plugins

| Plugin | Install | Description |
|--------|---------|-------------|
| **Faker** | `/plugin install zammy-plugin-faker` | Generate fake data (emails, names, addresses, credit cards) |
| **Port Manager** | `/plugin install zammy-plugin-port` | List, check, and kill processes by port |
| **Network Tools** | `/plugin install zammy-plugin-network` | IP lookup, ping, DNS, speed test |
| **Docker** | `/plugin install zammy-plugin-docker` | Manage containers with pretty output |

### Creating a Plugin

```bash
/plugin create my-plugin
```

This scaffolds a new plugin with:
```
my-plugin/
├── zammy-plugin.json   # Plugin manifest
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts        # Your plugin code
└── README.md
```

### Plugin Manifest

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "displayName": "My Plugin",
  "description": "Does something cool",
  "main": "./dist/index.js",
  "commands": ["mycommand"],
  "zammy": {
    "minVersion": "1.3.0"
  },
  "permissions": {
    "shell": false,
    "filesystem": false,
    "network": false
  }
}
```

### Plugin API

Plugins receive a full API for integration:

```typescript
export default {
  activate(api) {
    // Register commands
    api.registerCommand({
      name: 'mycommand',
      description: 'My custom command',
      usage: '/mycommand [args]',
      async execute(args) {
        const { theme, symbols } = api.ui;
        console.log(theme.success('Hello from my plugin!'));
      }
    });

    // Use storage
    api.storage.set('key', 'value');

    // Logging
    api.log.info('Plugin loaded!');
  }
}
```

**Available API:**
- `api.registerCommand()` — Add new commands
- `api.ui.theme` — Access Zammy's color theme
- `api.ui.symbols` — Access Unicode symbols
- `api.storage` — Persistent key-value storage
- `api.log` — Prefixed logging (info, warn, error)
- `api.context` — Plugin metadata & paths
- `api.shell` — Shell access (if permitted)

---

## Configuration

Zammy works out of the box with sensible defaults:

- **Double Ctrl+C** to exit (prevents accidents)
- **Persistent data** stored in `~/.zammy/`
- **Command history** remembered across sessions

### CLI Flags

```bash
zammy --simple    # Disable animations (for CI/pipes)
zammy --no-menu   # Disable interactive menu
zammy --version   # Show version
zammy --help      # Show help
```

---

## Comparison

| Feature | Zammy | Oh My Zsh | tldr | Warp |
|---------|-------|-----------|------|------|
| Install | Node.js + `npm i -g` | Shell script | Package manager | App download |
| Cross-platform | Win/Mac/Linux | Mac/Linux | All | Mac only |
| Interactive menu | Yes | No | No | Yes |
| Built-in dev tools | 26+ commands | Aliases only | Help only | AI suggestions |
| Plugin system | Yes | Yes (300+) | No | No |
| Mascot/personality | Zammy! | No | No | No |
| Offline | Yes | Yes | Yes | Partial |

---

## Development

```bash
# Clone and install
git clone https://github.com/aayushadhikari7/zammy-cli.git
cd zammy-cli
npm install

# Development
npm run dev      # Watch mode
npm run build    # Build
npm test         # Run tests

# Link for local testing
npm link
zammy
```

### Project Structure

```
zammy-cli/
├── src/
│   ├── index.ts          # Entry point & REPL
│   ├── cli.ts            # Command parser
│   ├── commands/         # Command implementations
│   │   ├── utilities/    # calc, password, stats, etc.
│   │   ├── fun/          # joke, quote, zammy, etc.
│   │   ├── creative/     # asciiart, figlet, lorem
│   │   ├── dev/          # hash, uuid, encode, json, request, diff
│   │   ├── info/         # weather
│   │   └── plugin/       # Plugin management
│   ├── handlers/         # Reusable logic (testable)
│   ├── plugins/          # Plugin system
│   └── ui/               # Colors, banner, mascot
├── packages/plugins/     # Official plugins (published separately)
│   ├── docker/           # zammy-plugin-docker
│   ├── faker/            # zammy-plugin-faker
│   ├── network/          # zammy-plugin-network
│   └── port/             # zammy-plugin-port
└── dist/                 # Built output
```

---

## Contributing

We welcome contributions! Whether it's:
- New commands
- Bug fixes
- Plugin development
- Documentation improvements

```bash
# 1. Fork the repo
# 2. Create a branch
git checkout -b feature/awesome-feature

# 3. Make changes & test
npm test

# 4. Commit and push
git commit -m "Add awesome feature"
git push origin feature/awesome-feature

# 5. Open a Pull Request
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**[Back to top](#zammy-cli)**

Made with TypeScript, Node.js, and a lot of purple

If Zammy made you smile, give us a star!

</div>
