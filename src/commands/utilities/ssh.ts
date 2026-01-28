import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import {
  listSSHKeys,
  getPublicKeyContent,
  generateSSHKey,
  sshDirExists,
  getSSHDir,
  SSHKey,
} from '../../handlers/utilities/ssh.js';
import boxen from 'boxen';
import { execSync } from 'child_process';
import { platform } from 'os';

function copyToClipboard(text: string): boolean {
  try {
    const os = platform();
    if (os === 'darwin') {
      execSync('pbcopy', { input: text });
    } else if (os === 'win32') {
      execSync('clip', { input: text });
    } else {
      try {
        execSync('xclip -selection clipboard', { input: text });
      } catch {
        execSync('xsel --clipboard --input', { input: text });
      }
    }
    return true;
  } catch {
    return false;
  }
}

function formatKeyType(type: SSHKey['type']): string {
  switch (type) {
    case 'ed25519': return theme.success('ED25519');
    case 'rsa': return theme.warning('RSA');
    case 'ecdsa': return theme.accent('ECDSA');
    case 'dsa': return theme.error('DSA');
    default: return theme.dim('???');
  }
}

function showList(): void {
  if (!sshDirExists()) {
    console.log(theme.error(`SSH directory not found: ${getSSHDir()}`));
    return;
  }

  const keys = listSSHKeys();

  console.log(boxen(theme.accent(' SSH Keys '), { padding: 0, borderStyle: 'round', borderColor: 'cyan' }));
  console.log();

  if (keys.length === 0) {
    console.log(theme.dim('  No SSH keys found.'));
    console.log('');
    console.log(theme.dim('  Generate one with:'));
    console.log(`    ${theme.primary('/ssh generate')} ${theme.accent('<name>')}`);
    console.log('');
    return;
  }

  for (const key of keys) {
    const status = key.hasPrivate && key.hasPublic ? symbols.check :
                   key.hasPublic ? theme.dim('pub') :
                   theme.dim('priv');

    const bits = key.bits ? theme.dim(` ${key.bits}b`) : '';

    console.log(`  ${status} ${theme.primary(key.name.padEnd(20))} ${formatKeyType(key.type)}${bits}`);

    if (key.fingerprint) {
      console.log(`      ${theme.dim(key.fingerprint)}`);
    }
    if (key.comment) {
      console.log(`      ${theme.dim(key.comment)}`);
    }
  }

  console.log('');
  console.log(theme.dim(`  Location: ${getSSHDir()}`));
  console.log('');
}

function showKey(name: string): void {
  const content = getPublicKeyContent(name);

  if (!content) {
    console.log(theme.error(`Public key not found: ${name}`));
    return;
  }

  console.log('');
  console.log(boxen(content, {
    padding: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    title: `${name}.pub`,
    titleAlignment: 'left',
  }));
  console.log('');
}

function doCopy(name: string): void {
  if (!name) {
    console.log(theme.error('Usage: /ssh copy <name>'));
    return;
  }

  const content = getPublicKeyContent(name);

  if (!content) {
    console.log(theme.error(`Public key not found: ${name}`));
    return;
  }

  if (copyToClipboard(content)) {
    console.log(`${symbols.check} ${theme.success('Public key copied to clipboard:')} ${theme.accent(name)}`);
  } else {
    console.log(theme.error('Failed to copy to clipboard'));
  }
}

function doGenerate(args: string[]): void {
  let type: 'ed25519' | 'rsa' = 'ed25519';
  let comment: string | undefined;
  let name: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--type' || args[i] === '-t') && args[i + 1]) {
      const t = args[i + 1].toLowerCase();
      if (t === 'rsa' || t === 'ed25519') {
        type = t;
      }
      i++;
    } else if ((args[i] === '--comment' || args[i] === '-C') && args[i + 1]) {
      comment = args[i + 1];
      i++;
    } else if (!name) {
      name = args[i];
    }
  }

  if (!name) {
    console.log(theme.error('Usage: /ssh generate <name> [--type ed25519|rsa]'));
    return;
  }

  console.log(theme.dim(`  Generating ${type.toUpperCase()} key: ${name}...`));

  const result = generateSSHKey(name, type, comment);

  if (result.success) {
    console.log(`${symbols.check} ${theme.success('SSH key generated!')}`);
    console.log('');
    console.log(`  ${theme.primary('Private key:')} ${result.path}`);
    console.log(`  ${theme.primary('Public key:')}  ${result.path}.pub`);
    console.log('');
    console.log(theme.dim('  Copy public key with:'));
    console.log(`    ${theme.primary(`/ssh copy ${name}`)}`);
    console.log('');
  } else {
    console.log(theme.error(`Failed to generate key: ${result.error}`));
  }
}

function showHelp(): void {
  console.log('');
  console.log(theme.secondary('Usage:'));
  console.log(`  ${theme.primary('/ssh')}                     ${theme.dim('List SSH keys')}`);
  console.log(`  ${theme.primary('/ssh list')}                ${theme.dim('List SSH keys')}`);
  console.log(`  ${theme.primary('/ssh show <name>')}         ${theme.dim('Show public key content')}`);
  console.log(`  ${theme.primary('/ssh copy <name>')}         ${theme.dim('Copy public key to clipboard')}`);
  console.log(`  ${theme.primary('/ssh generate <name>')}     ${theme.dim('Generate new key pair')}`);
  console.log('');
  console.log(theme.secondary('Options for generate:'));
  console.log(`  ${theme.dim('--type, -t')}      Key type: ed25519 (default) or rsa`);
  console.log(`  ${theme.dim('--comment, -C')}   Key comment`);
  console.log('');
  console.log(theme.secondary('Examples:'));
  console.log(`  ${theme.dim('/ssh generate github')}`);
  console.log(`  ${theme.dim('/ssh generate work --type rsa')}`);
  console.log(`  ${theme.dim('/ssh copy github')}`);
  console.log('');
}

registerCommand({
  name: 'ssh',
  description: 'Manage SSH keys',
  usage: '/ssh [list|show|copy|generate] [args]',
  execute: async (args) => {
    const subcommand = args[0]?.toLowerCase();

    if (!subcommand || subcommand === 'list') {
      showList();
      return;
    }

    if (subcommand === 'help' || subcommand === '--help' || subcommand === '-h') {
      showHelp();
      return;
    }

    if (subcommand === 'show' || subcommand === 'get') {
      showKey(args[1]);
      return;
    }

    if (subcommand === 'copy' || subcommand === 'cp') {
      doCopy(args[1]);
      return;
    }

    if (subcommand === 'generate' || subcommand === 'gen' || subcommand === 'new') {
      doGenerate(args.slice(1));
      return;
    }

    // Unknown subcommand - maybe it's a key name?
    const keys = listSSHKeys();
    const key = keys.find(k => k.name === subcommand);
    if (key) {
      showKey(subcommand);
      return;
    }

    console.log(theme.error(`Unknown subcommand: ${subcommand}`));
    showHelp();
  },
});
