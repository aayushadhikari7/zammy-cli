# zammy-plugin-port

Manage ports and processes from your terminal.

## Installation

```bash
/plugin install zammy-plugin-port
```

## Commands

### `/port list`

Show all listening ports on your system.

```
  PORT    PID       PROCESS
  ────────────────────────────────────────
  3000    12345     node
  5432    6789      postgres
  8080    11111     java

  Total: 3 ports
```

### `/port check <port>`

Check if a specific port is in use.

```bash
/port check 3000
# Port 3000 is in use
# PID: 12345
# Process: node
```

### `/port kill <port>`

Kill the process running on a specific port.

```bash
/port kill 3000
# Process killed (PID: 12345)
```

**Note:** May require administrator/root privileges for some processes.

### `/port find <name>`

Find all ports used by processes matching a name.

```bash
/port find node
# PORTS FOR "NODE"
# PORT    PID       PROCESS
# 3000    12345     node
# 3001    12346     node
```

## Cross-Platform Support

This plugin works on:
- **Windows** - Uses `netstat` and `taskkill`
- **macOS** - Uses `lsof` and `kill`
- **Linux** - Uses `lsof`/`netstat` and `kill`

## Permissions

This plugin requires shell access to run system commands.

## License

MIT
