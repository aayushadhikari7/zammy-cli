export interface Command {
  name: string;
  description: string;
  usage: string;
  execute: (args: string[]) => Promise<void>;
}

export interface RegisteredCommand extends Command {
  source: 'core' | 'plugin';
  pluginName?: string;
}

const commands = new Map<string, RegisteredCommand>();

// Register a core command
export function registerCommand(command: Command): void {
  commands.set(command.name, { ...command, source: 'core' });
}

// Register a plugin command
export function registerPluginCommand(command: Command, pluginName: string): void {
  commands.set(command.name, { ...command, source: 'plugin', pluginName });
}

// Unregister all commands from a specific plugin
export function unregisterPluginCommands(pluginName: string): void {
  for (const [name, cmd] of commands.entries()) {
    if (cmd.source === 'plugin' && cmd.pluginName === pluginName) {
      commands.delete(name);
    }
  }
}

// Get a command by name
export function getCommand(name: string): RegisteredCommand | undefined {
  return commands.get(name);
}

// Get all commands
export function getAllCommands(): RegisteredCommand[] {
  return Array.from(commands.values());
}

// Get all core commands
export function getCoreCommands(): RegisteredCommand[] {
  return Array.from(commands.values()).filter(cmd => cmd.source === 'core');
}

// Get all plugin commands
export function getPluginCommands(): RegisteredCommand[] {
  return Array.from(commands.values()).filter(cmd => cmd.source === 'plugin');
}

// Get the plugin name for a command
export function getPluginForCommand(name: string): string | undefined {
  return commands.get(name)?.pluginName;
}

// Check if a command exists
export function hasCommand(name: string): boolean {
  return commands.has(name);
}

// Check if a command name conflicts with existing commands
export function checkCommandConflict(name: string): { exists: boolean; source?: 'core' | 'plugin'; pluginName?: string } {
  const existing = commands.get(name);
  if (!existing) {
    return { exists: false };
  }
  return {
    exists: true,
    source: existing.source,
    pluginName: existing.pluginName,
  };
}
