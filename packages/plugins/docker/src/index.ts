// Zammy Plugin: Docker
// Docker container management with pretty output

import type { PluginAPI, ZammyPlugin } from 'zammy/plugins';

interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string;
  created: string;
  running: boolean;
}

interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
}

interface ContainerStats {
  id: string;
  name: string;
  cpu: string;
  memory: string;
  netIO: string;
  blockIO: string;
}

// ============ HELPERS ============

async function checkDockerInstalled(
  shell: NonNullable<PluginAPI['shell']>
): Promise<{ installed: boolean; version?: string; running?: boolean }> {
  try {
    const result = await shell.spawn('docker', ['--version']);
    if (result.code !== 0) {
      return { installed: false };
    }

    const match = result.stdout.match(/Docker version ([\d.]+)/);
    const version = match?.[1];

    // Check if Docker daemon is running
    const infoResult = await shell.spawn('docker', ['info']);
    const running = infoResult.code === 0;

    return { installed: true, version, running };
  } catch {
    return { installed: false };
  }
}

async function getContainers(
  shell: NonNullable<PluginAPI['shell']>,
  all: boolean = false
): Promise<Container[]> {
  const args = [
    'ps',
    '--format', '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.CreatedAt}}'
  ];
  if (all) args.push('-a');

  const result = await shell.spawn('docker', args);
  if (result.code !== 0) return [];

  const containers: Container[] = [];
  const lines = result.stdout.trim().split('\n').filter(Boolean);

  for (const line of lines) {
    const [id, name, image, status, ports, created] = line.split('\t');
    containers.push({
      id: id || '',
      name: name || '',
      image: image || '',
      status: status || '',
      ports: ports || '-',
      created: created || '',
      running: status?.toLowerCase().includes('up') ?? false
    });
  }

  return containers;
}

async function getImages(shell: NonNullable<PluginAPI['shell']>): Promise<DockerImage[]> {
  const result = await shell.spawn('docker', [
    'images',
    '--format', '{{.ID}}\t{{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}'
  ]);

  if (result.code !== 0) return [];

  const images: DockerImage[] = [];
  const lines = result.stdout.trim().split('\n').filter(Boolean);

  for (const line of lines) {
    const [id, repository, tag, size, created] = line.split('\t');
    images.push({
      id: id || '',
      repository: repository || '',
      tag: tag || '',
      size: size || '',
      created: created || ''
    });
  }

  return images;
}

async function getContainerStats(shell: NonNullable<PluginAPI['shell']>): Promise<ContainerStats[]> {
  const result = await shell.spawn('docker', [
    'stats',
    '--no-stream',
    '--format', '{{.ID}}\t{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}'
  ]);

  if (result.code !== 0) return [];

  const stats: ContainerStats[] = [];
  const lines = result.stdout.trim().split('\n').filter(Boolean);

  for (const line of lines) {
    const [id, name, cpu, memory, netIO, blockIO] = line.split('\t');
    stats.push({
      id: id || '',
      name: name || '',
      cpu: cpu || '0%',
      memory: memory || '0B / 0B',
      netIO: netIO || '0B / 0B',
      blockIO: blockIO || '0B / 0B'
    });
  }

  return stats;
}

async function getContainerLogs(
  shell: NonNullable<PluginAPI['shell']>,
  container: string,
  lines: number = 20
): Promise<{ logs: string; error?: string }> {
  const result = await shell.spawn('docker', ['logs', '--tail', lines.toString(), container]);

  if (result.code !== 0) {
    return { logs: '', error: result.stderr || 'Failed to get logs' };
  }

  // Docker logs can be in stdout or stderr depending on the container
  return { logs: result.stdout || result.stderr };
}

async function inspectContainer(
  shell: NonNullable<PluginAPI['shell']>,
  container: string
): Promise<{ info: Record<string, unknown> | null; error?: string }> {
  const result = await shell.spawn('docker', ['inspect', container]);

  if (result.code !== 0) {
    return { info: null, error: result.stderr || 'Container not found' };
  }

  try {
    const data = JSON.parse(result.stdout);
    return { info: data[0] };
  } catch {
    return { info: null, error: 'Failed to parse container info' };
  }
}

async function pruneDocker(
  shell: NonNullable<PluginAPI['shell']>,
  options: { all?: boolean; volumes?: boolean }
): Promise<{ success: boolean; spaceReclaimed?: string; error?: string }> {
  try {
    // System prune
    const args = ['system', 'prune', '-f'];
    if (options.all) args.push('-a');
    if (options.volumes) args.push('--volumes');

    const result = await shell.spawn('docker', args);

    if (result.code !== 0) {
      return { success: false, error: result.stderr };
    }

    // Extract space reclaimed
    const match = result.stdout.match(/Total reclaimed space:\s*([\d.]+\s*\w+)/i);
    const spaceReclaimed = match?.[1] || 'Unknown';

    return { success: true, spaceReclaimed };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function formatAge(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return dateStr;
  }
}

// ============ PLUGIN ============

const plugin: ZammyPlugin = {
  activate(api: PluginAPI) {
    const { theme, symbols } = api.ui;

    if (!api.shell) {
      api.log.error('Docker plugin requires shell permission');
      return;
    }

    const shell = api.shell;

    api.registerCommand({
      name: 'docker',
      description: 'Docker container management',
      usage: '/docker <action> [args]\n\n  Actions: ps, images, logs, stats, prune, inspect',
      async execute(args: string[]) {
        // Check Docker installation first
        const docker = await checkDockerInstalled(shell);

        if (!docker.installed) {
          console.log('');
          console.log(`  ${symbols.cross} ${theme.error('Docker is not installed')}`);
          console.log('');
          console.log(`  ${theme.dim('Install Docker:')} https://docker.com/get-started`);
          console.log('');
          return;
        }

        if (!docker.running) {
          console.log('');
          console.log(`  ${symbols.warning} ${theme.warning('Docker daemon is not running')}`);
          console.log('');
          console.log(`  ${theme.dim('Start Docker Desktop or run:')} sudo systemctl start docker`);
          console.log('');
          return;
        }

        const action = args[0]?.toLowerCase();

        if (!action) {
          console.log('');
          console.log(`  ${symbols.rocket} ${theme.gradient('DOCKER')} ${theme.dim(`v${docker.version}`)}`);
          console.log('');
          console.log(`  ${theme.dim('Usage:')} /docker <action> [args]`);
          console.log('');
          console.log(`  ${theme.dim('Actions:')}`);
          console.log(`    ${theme.primary('ps')}               ${theme.dim('List containers (use -a for all)')}`);
          console.log(`    ${theme.primary('images')}           ${theme.dim('List images')}`);
          console.log(`    ${theme.primary('logs <id>')}        ${theme.dim('View container logs')}`);
          console.log(`    ${theme.primary('stats')}            ${theme.dim('Show resource usage')}`);
          console.log(`    ${theme.primary('prune')}            ${theme.dim('Clean up unused resources')}`);
          console.log(`    ${theme.primary('inspect <id>')}     ${theme.dim('Show container details')}`);
          console.log('');
          return;
        }

        console.log('');

        switch (action) {
          case 'ps': {
            const showAll = args.includes('-a') || args.includes('--all');
            const containers = await getContainers(shell, showAll);

            console.log(`  ${symbols.rocket} ${theme.gradient(showAll ? 'ALL CONTAINERS' : 'RUNNING CONTAINERS')}`);
            console.log('');

            if (containers.length === 0) {
              console.log(`  ${theme.dim(showAll ? 'No containers found' : 'No running containers')}`);
              if (!showAll) {
                console.log(`  ${theme.dim('Use')} /docker ps -a ${theme.dim('to show all containers')}`);
              }
            } else {
              console.log(`  ${theme.dim('ID'.padEnd(14))}${theme.dim('NAME'.padEnd(20))}${theme.dim('IMAGE'.padEnd(25))}${theme.dim('STATUS')}`);
              console.log(`  ${theme.dim('─'.repeat(70))}`);

              for (const c of containers) {
                const statusColor = c.running ? theme.success : theme.warning;
                const statusIcon = c.running ? symbols.check : symbols.warning;
                const shortStatus = c.status.split(' ').slice(0, 2).join(' ');

                console.log(
                  `  ${theme.primary(c.id.slice(0, 12).padEnd(14))}` +
                  `${theme.secondary(c.name.slice(0, 18).padEnd(20))}` +
                  `${c.image.slice(0, 23).padEnd(25)}` +
                  `${statusIcon} ${statusColor(shortStatus)}`
                );
              }

              console.log('');
              console.log(`  ${theme.dim(`Total: ${containers.length} containers`)}`);
            }
            break;
          }

          case 'images': {
            const images = await getImages(shell);

            console.log(`  ${symbols.rocket} ${theme.gradient('DOCKER IMAGES')}`);
            console.log('');

            if (images.length === 0) {
              console.log(`  ${theme.dim('No images found')}`);
            } else {
              console.log(`  ${theme.dim('REPOSITORY'.padEnd(30))}${theme.dim('TAG'.padEnd(15))}${theme.dim('SIZE'.padEnd(12))}${theme.dim('AGE')}`);
              console.log(`  ${theme.dim('─'.repeat(65))}`);

              for (const img of images) {
                const repoDisplay = img.repository.length > 28
                  ? img.repository.slice(0, 25) + '...'
                  : img.repository;

                console.log(
                  `  ${theme.primary(repoDisplay.padEnd(30))}` +
                  `${theme.secondary(img.tag.slice(0, 13).padEnd(15))}` +
                  `${img.size.padEnd(12)}` +
                  `${theme.dim(formatAge(img.created))}`
                );
              }

              console.log('');
              console.log(`  ${theme.dim(`Total: ${images.length} images`)}`);
            }
            break;
          }

          case 'logs': {
            const container = args[1];
            if (!container) {
              console.log(`  ${symbols.warning} ${theme.warning('Usage:')} /docker logs <container-id>`);
              break;
            }

            const lineCount = parseInt(args[2]) || 20;
            console.log(`  ${theme.dim(`Logs for`)} ${theme.primary(container)} ${theme.dim(`(last ${lineCount} lines)`)}`);
            console.log(`  ${theme.dim('─'.repeat(50))}`);
            console.log('');

            const { logs, error } = await getContainerLogs(shell, container, lineCount);

            if (error) {
              console.log(`  ${symbols.cross} ${theme.error(error)}`);
              break;
            }

            if (!logs.trim()) {
              console.log(`  ${theme.dim('No logs available')}`);
            } else {
              const logLines = logs.trim().split('\n');
              for (const line of logLines) {
                // Color code log levels
                let coloredLine = line;
                if (line.includes('ERROR') || line.includes('error')) {
                  coloredLine = theme.error(line);
                } else if (line.includes('WARN') || line.includes('warn')) {
                  coloredLine = theme.warning(line);
                } else if (line.includes('INFO') || line.includes('info')) {
                  coloredLine = theme.dim(line);
                }
                console.log(`  ${coloredLine}`);
              }
            }
            break;
          }

          case 'stats': {
            console.log(`  ${symbols.rocket} ${theme.gradient('CONTAINER STATS')}`);
            console.log('');

            const stats = await getContainerStats(shell);

            if (stats.length === 0) {
              console.log(`  ${theme.dim('No running containers')}`);
            } else {
              console.log(`  ${theme.dim('NAME'.padEnd(20))}${theme.dim('CPU'.padEnd(10))}${theme.dim('MEMORY'.padEnd(20))}${theme.dim('NET I/O')}`);
              console.log(`  ${theme.dim('─'.repeat(60))}`);

              for (const s of stats) {
                const cpuValue = parseFloat(s.cpu);
                const cpuColor = cpuValue > 80 ? theme.error :
                                cpuValue > 50 ? theme.warning :
                                theme.success;

                console.log(
                  `  ${theme.primary(s.name.slice(0, 18).padEnd(20))}` +
                  `${cpuColor(s.cpu.padEnd(10))}` +
                  `${s.memory.slice(0, 18).padEnd(20)}` +
                  `${theme.dim(s.netIO)}`
                );
              }
            }
            break;
          }

          case 'prune': {
            const pruneAll = args.includes('-a') || args.includes('--all');
            const pruneVolumes = args.includes('--volumes');

            console.log(`  ${theme.dim('Cleaning up Docker resources...')}`);

            const result = await pruneDocker(shell, { all: pruneAll, volumes: pruneVolumes });

            if (result.success) {
              console.log(`  ${symbols.check} ${theme.success('Cleanup complete')}`);
              console.log('');
              console.log(`  ${theme.dim('Space reclaimed:')} ${theme.primary(result.spaceReclaimed || '0B')}`);

              if (!pruneAll) {
                console.log('');
                console.log(`  ${theme.dim('Tip: Use')} /docker prune -a ${theme.dim('to remove unused images too')}`);
              }
            } else {
              console.log(`  ${symbols.cross} ${theme.error(result.error || 'Prune failed')}`);
            }
            break;
          }

          case 'inspect': {
            const container = args[1];
            if (!container) {
              console.log(`  ${symbols.warning} ${theme.warning('Usage:')} /docker inspect <container-id>`);
              break;
            }

            const { info, error } = await inspectContainer(shell, container);

            if (error || !info) {
              console.log(`  ${symbols.cross} ${theme.error(error || 'Container not found')}`);
              break;
            }

            console.log(`  ${symbols.rocket} ${theme.gradient('CONTAINER DETAILS')}`);
            console.log('');

            // Extract useful info
            const name = (info['Name'] as string)?.replace('/', '') || 'Unknown';
            const id = (info['Id'] as string)?.slice(0, 12) || 'Unknown';
            const state = info['State'] as Record<string, unknown> || {};
            const config = info['Config'] as Record<string, unknown> || {};
            const networkSettings = info['NetworkSettings'] as Record<string, unknown> || {};

            console.log(`  ${theme.dim('Name:')}    ${theme.primary(name)}`);
            console.log(`  ${theme.dim('ID:')}      ${id}`);
            console.log(`  ${theme.dim('Image:')}   ${config['Image'] || 'Unknown'}`);
            console.log(`  ${theme.dim('Status:')}  ${state['Status'] ? theme.success(String(state['Status'])) : theme.warning('Unknown')}`);
            console.log(`  ${theme.dim('Created:')} ${info['Created'] || 'Unknown'}`);

            if (networkSettings['IPAddress']) {
              console.log(`  ${theme.dim('IP:')}      ${networkSettings['IPAddress']}`);
            }

            const ports = networkSettings['Ports'] as Record<string, unknown[]> || {};
            if (Object.keys(ports).length > 0) {
              console.log('');
              console.log(`  ${theme.dim('Ports:')}`);
              for (const [containerPort, bindings] of Object.entries(ports)) {
                if (bindings && bindings.length > 0) {
                  const binding = bindings[0] as Record<string, string>;
                  console.log(`    ${theme.secondary(containerPort)} ${symbols.arrow} ${binding['HostPort'] || 'none'}`);
                } else {
                  console.log(`    ${theme.secondary(containerPort)} ${symbols.arrow} ${theme.dim('not bound')}`);
                }
              }
            }

            const env = (config['Env'] as string[]) || [];
            if (env.length > 0) {
              console.log('');
              console.log(`  ${theme.dim('Environment:')} ${theme.dim(`(${env.length} vars)`)}`);
              // Show first 5 env vars
              for (const e of env.slice(0, 5)) {
                const [key] = e.split('=');
                console.log(`    ${theme.dim(key)}`);
              }
              if (env.length > 5) {
                console.log(`    ${theme.dim(`... and ${env.length - 5} more`)}`);
              }
            }
            break;
          }

          default:
            console.log(`  ${symbols.cross} ${theme.error(`Unknown action: ${action}`)}`);
            console.log(`  ${theme.dim('Run /docker to see available actions')}`);
        }

        console.log('');
      }
    });

    api.log.info('Docker plugin activated');
  }
};

export default plugin;
