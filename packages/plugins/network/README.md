# zammy-plugin-network

Network utilities and diagnostics for your terminal.

## Installation

```bash
/plugin install zammy-plugin-network
```

## Commands

### `/net ip`

Show your local and public IP addresses.

```
  IP ADDRESSES

  Local:
    → 192.168.1.100

  Public: 203.0.113.42
```

### `/net ping <host>`

Ping a host and show response times.

```bash
/net ping google.com

  Pinging google.com...

  ✔ Reply 1: 15ms TTL=117
  ✔ Reply 2: 14ms TTL=117
  ✔ Reply 3: 16ms TTL=117
  ✔ Reply 4: 14ms TTL=117

  Min: 14ms  Max: 16ms  Avg: 14.8ms
```

### `/net dns <domain>`

Perform DNS lookup and show all records.

```bash
/net dns github.com

  DNS: GITHUB.COM

  TYPE    VALUE
  ──────────────────────────────────────────────
  A       140.82.112.3
  AAAA    2606:50c0:8000::154
  MX      10 alt1.aspmx.l.google.com
  NS      dns1.p08.nsone.net
```

### `/net speed`

Run a download speed test.

```bash
/net speed

  SPEED TEST

  ✔ Test complete

  Download: 95.42 Mbps
  Latency:  45ms
  Data:     5.0 MB in 0.4s
```

### `/net headers <url>`

Fetch and display HTTP headers for a URL.

```bash
/net headers example.com

  Status: 200 OK

  Headers:
  ──────────────────────────────────────────────
  content-type: text/html; charset=UTF-8
  content-length: 1256
  server: nginx
  cache-control: max-age=604800
```

### `/net ports`

Display a reference table of common ports.

```
  COMMON PORTS

  PORT    SERVICE           PROTOCOL
  ────────────────────────────────────────
  22      SSH               TCP
  80      HTTP              TCP
  443     HTTPS             TCP
  3306    MySQL             TCP
  5432    PostgreSQL        TCP
  6379    Redis             TCP
  ...
```

## Cross-Platform Support

This plugin works on:
- **Windows** - Uses Windows ping
- **macOS** - Uses macOS ping
- **Linux** - Uses Linux ping

## Permissions

This plugin requires:
- **shell** - For ping command
- **network** - For public IP and speed test

## License

MIT
