# zammy-plugin-docker

Docker container management with pretty output.

## Installation

```bash
/plugin install zammy-plugin-docker
```

## Requirements

- Docker must be installed and running
- Docker daemon must be accessible (may require sudo on Linux)

## Commands

### `/docker ps`

List running containers. Use `-a` flag to show all containers.

```bash
/docker ps

  RUNNING CONTAINERS

  ID            NAME                IMAGE                    STATUS
  ──────────────────────────────────────────────────────────────────────
  abc123def456  my-app              node:18                  ✔ Up 2 hours
  789xyz012abc  postgres            postgres:15              ✔ Up 3 days

  Total: 2 containers
```

### `/docker images`

List all Docker images.

```bash
/docker images

  DOCKER IMAGES

  REPOSITORY                    TAG            SIZE        AGE
  ─────────────────────────────────────────────────────────────────
  node                          18             950MB       2 days ago
  postgres                      15             380MB       1 month ago
  nginx                         latest         140MB       3 days ago

  Total: 3 images
```

### `/docker logs <container>`

View container logs (last 20 lines by default).

```bash
/docker logs my-app

  Logs for my-app (last 20 lines)
  ──────────────────────────────────────────────

  [INFO] Server starting on port 3000
  [INFO] Database connected
  [WARN] Cache miss for user:123
```

### `/docker stats`

Show real-time resource usage for running containers.

```bash
/docker stats

  CONTAINER STATS

  NAME                CPU       MEMORY              NET I/O
  ────────────────────────────────────────────────────────────
  my-app              2.5%      125MiB / 8GiB       1.2MB / 500KB
  postgres            0.8%      250MiB / 8GiB       800KB / 1.5MB
```

### `/docker prune`

Clean up unused Docker resources.

```bash
/docker prune

  ✔ Cleanup complete

  Space reclaimed: 2.5GB

  Tip: Use /docker prune -a to remove unused images too
```

Flags:
- `-a` or `--all` - Remove all unused images, not just dangling ones
- `--volumes` - Also remove unused volumes

### `/docker inspect <container>`

Show detailed information about a container.

```bash
/docker inspect my-app

  CONTAINER DETAILS

  Name:    my-app
  ID:      abc123def456
  Image:   node:18
  Status:  running
  Created: 2024-01-15T10:30:00Z
  IP:      172.17.0.2

  Ports:
    3000/tcp → 3000

  Environment: (5 vars)
    NODE_ENV
    PORT
    DATABASE_URL
    ... and 2 more
```

## Error Handling

The plugin gracefully handles:
- Docker not installed
- Docker daemon not running
- Container not found
- Permission issues

## Permissions

This plugin requires shell access to run Docker commands.

## License

MIT
