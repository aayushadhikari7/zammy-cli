import { getCommand } from './commands/index.js';
import { theme, symbols, progressBar } from './ui/colors.js';
import { displayBanner } from './ui/banner.js';
import { miniSlime, showMascot, getRandomMood, react, getMoodFromText } from './ui/slime-animated.js';
import { exec, execSync, spawn } from 'child_process';
import { existsSync, statSync, readFileSync, readdirSync, writeFileSync, watchFile, unwatchFile } from 'fs';
import { resolve, extname, basename, join } from 'path';
import { homedir, platform, networkInterfaces } from 'os';
import chalk from 'chalk';

const isWindows = platform() === 'win32';

// Translate Linux commands to Windows equivalents
function translateCommand(cmd: string): string {
  if (!isWindows) return cmd; // No translation needed on Linux/Mac

  const parts = cmd.trim().split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case 'ls': {
      // Handle ls flags
      const hasAll = args.some(a => a === '-a' || a === '-la' || a === '-al' || a === '-all');
      const hasLong = args.some(a => a === '-l' || a === '-la' || a === '-al');
      const pathArgs = args.filter(a => !a.startsWith('-'));

      let winCmd = 'dir';
      if (hasAll) winCmd += ' /a';
      if (pathArgs.length > 0) winCmd += ' ' + pathArgs.join(' ');
      return winCmd;
    }

    case 'cat':
      // cat file.txt → type file.txt
      return 'type ' + args.join(' ');

    case 'clear':
      return 'cls';

    case 'rm': {
      // rm file → del file, rm -r dir → rmdir /s /q dir
      const hasRecursive = args.some(a => a === '-r' || a === '-rf' || a === '-fr');
      const hasForce = args.some(a => a === '-f' || a === '-rf' || a === '-fr');
      const pathArgs = args.filter(a => !a.startsWith('-'));

      if (hasRecursive) {
        return 'rmdir /s' + (hasForce ? ' /q' : '') + ' ' + pathArgs.join(' ');
      }
      return 'del' + (hasForce ? ' /f' : '') + ' ' + pathArgs.join(' ');
    }

    case 'cp': {
      // cp src dest → copy src dest
      const hasRecursive = args.some(a => a === '-r' || a === '-R');
      const pathArgs = args.filter(a => !a.startsWith('-'));
      if (hasRecursive) {
        return 'xcopy /e /i ' + pathArgs.join(' ');
      }
      return 'copy ' + pathArgs.join(' ');
    }

    case 'mv':
      // mv src dest → move src dest
      return 'move ' + args.join(' ');

    case 'touch':
      // touch file → create empty file
      return 'type nul > ' + args.join(' ');

    case 'grep':
      // grep pattern file → findstr pattern file
      return 'findstr ' + args.join(' ');

    case 'which':
      // which cmd → where cmd
      return 'where ' + args.join(' ');

    case 'echo':
      return 'echo ' + args.join(' ');

    default:
      return cmd;
  }
}

// Handle cd specially since it needs to change the parent process directory
function handleCd(args: string): void {
  let targetPath = args.trim();

  // Handle empty cd or ~ for home directory
  if (!targetPath || targetPath === '~') {
    targetPath = homedir();
  } else if (targetPath.startsWith('~/')) {
    targetPath = resolve(homedir(), targetPath.slice(2));
  } else if (targetPath === '-') {
    // cd - could go to previous dir, but we'll just show current
    console.log(theme.dim(process.cwd()));
    return;
  } else {
    targetPath = resolve(process.cwd(), targetPath);
  }

  if (!existsSync(targetPath)) {
    console.log(`${miniSlime.sad} ${theme.error(`Directory not found: ${targetPath}`)}`);
    return;
  }

  try {
    const stats = statSync(targetPath);
    if (!stats.isDirectory()) {
      console.log(`${miniSlime.sad} ${theme.error(`Not a directory: ${targetPath}`)}`);
      return;
    }
    process.chdir(targetPath);
    console.log(theme.dim(process.cwd()));
  } catch (error) {
    console.log(`${miniSlime.sad} ${theme.error(`Cannot access: ${targetPath}`)}`);
  }
}

// Handle pwd - just show current directory
function handlePwd(): void {
  console.log(theme.primary(process.cwd()));
}

// Handle cat/type with nice output and syntax highlighting
function handleCat(args: string): void {
  const filePath = resolve(process.cwd(), args.trim());

  if (!existsSync(filePath)) {
    console.log(`${miniSlime.sad} ${theme.error(`File not found: ${args}`)}`);
    return;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const ext = extname(filePath).toLowerCase();

    // Simple syntax highlighting for common file types
    if (['.js', '.ts', '.jsx', '.tsx', '.json', '.css', '.html', '.py', '.go', '.rs'].includes(ext)) {
      console.log(highlightSyntax(content, ext));
    } else {
      console.log(content);
    }
  } catch (error) {
    console.log(`${miniSlime.sad} ${theme.error(`Cannot read file: ${args}`)}`);
  }
}

// Simple syntax highlighting
function highlightSyntax(content: string, ext: string): string {
  const keywords = {
    js: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined'],
    py: ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'with', 'as', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'lambda', 'async', 'await'],
  };

  const kw = ext === '.py' ? keywords.py : keywords.js;

  return content.split('\n').map(line => {
    // Highlight strings
    line = line.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g, match => chalk.hex('#98C379')(match));
    // Highlight comments
    line = line.replace(/(\/\/.*$|#.*$)/g, match => chalk.hex('#5C6370')(match));
    // Highlight numbers
    line = line.replace(/\b(\d+\.?\d*)\b/g, match => chalk.hex('#D19A66')(match));
    // Highlight keywords
    kw.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
      line = line.replace(regex, chalk.hex('#C678DD')(keyword));
    });
    return line;
  }).join('\n');
}

// File type icons and colors
const fileIcons: Record<string, { icon: string; color: string }> = {
  // Folders
  'dir': { icon: '📁', color: '#61AFEF' },
  // Code
  '.js': { icon: '📜', color: '#F7DF1E' },
  '.ts': { icon: '📘', color: '#3178C6' },
  '.jsx': { icon: '⚛️ ', color: '#61DAFB' },
  '.tsx': { icon: '⚛️ ', color: '#3178C6' },
  '.py': { icon: '🐍', color: '#3776AB' },
  '.go': { icon: '🐹', color: '#00ADD8' },
  '.rs': { icon: '🦀', color: '#DEA584' },
  '.java': { icon: '☕', color: '#ED8B00' },
  '.cpp': { icon: '⚙️ ', color: '#00599C' },
  '.c': { icon: '⚙️ ', color: '#A8B9CC' },
  '.cs': { icon: '🎯', color: '#239120' },
  '.rb': { icon: '💎', color: '#CC342D' },
  '.php': { icon: '🐘', color: '#777BB4' },
  '.swift': { icon: '🕊️ ', color: '#FA7343' },
  '.kt': { icon: '🎯', color: '#7F52FF' },
  // Web
  '.html': { icon: '🌐', color: '#E34F26' },
  '.css': { icon: '🎨', color: '#1572B6' },
  '.scss': { icon: '🎨', color: '#CC6699' },
  '.vue': { icon: '💚', color: '#4FC08D' },
  '.svelte': { icon: '🔥', color: '#FF3E00' },
  // Data
  '.json': { icon: '📋', color: '#CBCB41' },
  '.yaml': { icon: '📋', color: '#CB171E' },
  '.yml': { icon: '📋', color: '#CB171E' },
  '.xml': { icon: '📋', color: '#E34F26' },
  '.csv': { icon: '📊', color: '#217346' },
  // Config
  '.env': { icon: '🔐', color: '#ECD53F' },
  '.gitignore': { icon: '🙈', color: '#F05032' },
  '.dockerignore': { icon: '🐳', color: '#2496ED' },
  // Docs
  '.md': { icon: '📝', color: '#083FA1' },
  '.txt': { icon: '📄', color: '#6C7A89' },
  '.pdf': { icon: '📕', color: '#FF0000' },
  // Images
  '.png': { icon: '🖼️ ', color: '#FFB13B' },
  '.jpg': { icon: '🖼️ ', color: '#FFB13B' },
  '.jpeg': { icon: '🖼️ ', color: '#FFB13B' },
  '.gif': { icon: '🖼️ ', color: '#FFB13B' },
  '.svg': { icon: '🎨', color: '#FFB13B' },
  '.ico': { icon: '🖼️ ', color: '#FFB13B' },
  // Packages
  '.zip': { icon: '📦', color: '#FFC107' },
  '.tar': { icon: '📦', color: '#FFC107' },
  '.gz': { icon: '📦', color: '#FFC107' },
  '.rar': { icon: '📦', color: '#FFC107' },
  // Executables
  '.exe': { icon: '⚡', color: '#00A4EF' },
  '.sh': { icon: '⚡', color: '#4EAA25' },
  '.bat': { icon: '⚡', color: '#C1F12E' },
  '.cmd': { icon: '⚡', color: '#C1F12E' },
  // Default
  'default': { icon: '📄', color: '#6C7A89' },
};

// Format file size in human-readable format
function formatSize(bytes: number): string {
  if (bytes === 0) return chalk.dim('    0 B');
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
  return chalk.hex('#98C379')(size.padStart(5) + ' ' + units[i].padEnd(2));
}

// Enhanced ls with colors and icons
function handleLs(args: string): void {
  const parts = args.trim().split(/\s+/).filter(Boolean);
  const showAll = parts.some(a => a === '-a' || a === '-la' || a === '-al');
  const showLong = parts.some(a => a === '-l' || a === '-la' || a === '-al');
  const pathArgs = parts.filter(a => !a.startsWith('-'));
  const targetPath = pathArgs.length > 0 ? resolve(process.cwd(), pathArgs[0]) : process.cwd();

  if (!existsSync(targetPath)) {
    console.log(theme.error(`Directory not found: ${targetPath}`));
    return;
  }

  try {
    const entries = readdirSync(targetPath, { withFileTypes: true });
    const filtered = showAll ? entries : entries.filter(e => !e.name.startsWith('.'));

    console.log('');
    console.log(theme.dim(`  ${targetPath}`));
    console.log('');

    if (filtered.length === 0) {
      console.log(theme.dim('  (empty directory)'));
      console.log('');
      return;
    }

    // Sort: directories first, then files
    const sorted = filtered.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
      const fullPath = resolve(targetPath, entry.name);
      const isDir = entry.isDirectory();
      const ext = isDir ? 'dir' : extname(entry.name).toLowerCase();
      const iconInfo = fileIcons[ext] || fileIcons['default'];

      let line = `  ${iconInfo.icon} `;

      if (showLong) {
        try {
          const stats = statSync(fullPath);
          const size = isDir ? chalk.dim('   <DIR>') : formatSize(stats.size);
          const date = stats.mtime.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
          line += chalk.dim(date.padEnd(13)) + size + '  ';
        } catch {
          line += chalk.dim('             ') + '        ' + '  ';
        }
      }

      const name = isDir
        ? chalk.hex(iconInfo.color).bold(entry.name + '/')
        : chalk.hex(iconInfo.color)(entry.name);
      line += name;

      console.log(line);
    }

    console.log('');
    console.log(theme.dim(`  ${sorted.filter(e => e.isDirectory()).length} directories, ${sorted.filter(e => !e.isDirectory()).length} files`));
    console.log('');
  } catch (error) {
    console.log(theme.error(`Cannot read directory: ${targetPath}`));
  }
}

// Tree view for directories
function handleTree(args: string, maxDepth: number = 3): void {
  const parts = args.trim().split(/\s+/).filter(Boolean);
  const pathArgs = parts.filter(a => !a.startsWith('-'));
  const targetPath = pathArgs.length > 0 ? resolve(process.cwd(), pathArgs[0]) : process.cwd();

  if (!existsSync(targetPath)) {
    console.log(theme.error(`Directory not found: ${targetPath}`));
    return;
  }

  console.log('');
  console.log(theme.primary(`  📁 ${basename(targetPath)}/`));

  let dirCount = 0;
  let fileCount = 0;

  function printTree(dir: string, prefix: string, depth: number): void {
    if (depth > maxDepth) return;

    try {
      const entries = readdirSync(dir, { withFileTypes: true })
        .filter(e => !e.name.startsWith('.') && !['node_modules', '.git', 'dist', 'build'].includes(e.name))
        .sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });

      entries.forEach((entry, index) => {
        const isLast = index === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const ext = entry.isDirectory() ? 'dir' : extname(entry.name).toLowerCase();
        const iconInfo = fileIcons[ext] || fileIcons['default'];

        if (entry.isDirectory()) {
          dirCount++;
          console.log(theme.dim(prefix + connector) + iconInfo.icon + ' ' + chalk.hex(iconInfo.color).bold(entry.name + '/'));
          printTree(resolve(dir, entry.name), prefix + (isLast ? '    ' : '│   '), depth + 1);
        } else {
          fileCount++;
          console.log(theme.dim(prefix + connector) + iconInfo.icon + ' ' + chalk.hex(iconInfo.color)(entry.name));
        }
      });
    } catch {
      // Skip directories we can't read
    }
  }

  printTree(targetPath, '  ', 1);
  console.log('');
  console.log(theme.dim(`  ${dirCount} directories, ${fileCount} files`));
  console.log('');
}

// Directory bookmarks storage
const bookmarksFile = join(homedir(), '.zammy-bookmarks.json');

function loadBookmarks(): Record<string, string> {
  try {
    if (existsSync(bookmarksFile)) {
      return JSON.parse(readFileSync(bookmarksFile, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveBookmarks(bookmarks: Record<string, string>): void {
  writeFileSync(bookmarksFile, JSON.stringify(bookmarks, null, 2));
}

// Handle bookmark commands: bookmark save <name>, bookmark list, bookmark go <name>, bookmark del <name>
function handleBookmark(args: string): void {
  const parts = args.trim().split(/\s+/);
  const action = parts[0]?.toLowerCase();
  const name = parts[1];

  const bookmarks = loadBookmarks();

  console.log('');

  switch (action) {
    case 'save':
    case 'add':
      if (!name) {
        console.log(`  ${miniSlime.thinking} ${theme.error('Usage: bookmark save <name>')}`);
        break;
      }
      bookmarks[name] = process.cwd();
      saveBookmarks(bookmarks);
      console.log(`  ${miniSlime.happy} ${theme.success('Saved bookmark:')} ${theme.primary(name)} ${theme.dim('→')} ${process.cwd()}`);
      break;

    case 'go':
    case 'cd':
      if (!name || !bookmarks[name]) {
        console.log(`  ${miniSlime.sad} ${theme.error(`Bookmark not found: ${name}`)}`);
        console.log(theme.dim('  Use "bookmark list" to see all bookmarks'));
        break;
      }
      try {
        process.chdir(bookmarks[name]);
        console.log(`  ${miniSlime.excited} ${theme.dim('Jumped to')} ${theme.primary(name)}`);
        console.log(`  ${theme.dim(process.cwd())}`);
      } catch {
        console.log(`  ${miniSlime.sad} ${theme.error(`Cannot access: ${bookmarks[name]}`)}`);
      }
      break;

    case 'del':
    case 'delete':
    case 'rm':
      if (!name || !bookmarks[name]) {
        console.log(`  ${miniSlime.sad} ${theme.error(`Bookmark not found: ${name}`)}`);
        break;
      }
      delete bookmarks[name];
      saveBookmarks(bookmarks);
      console.log(`  ${miniSlime.happy} ${theme.success('Deleted bookmark:')} ${theme.primary(name)}`);
      break;

    case 'list':
    case 'ls':
    default:
      const keys = Object.keys(bookmarks);
      if (keys.length === 0) {
        console.log(theme.dim('  No bookmarks saved'));
        console.log(theme.dim('  Use "bookmark save <name>" to save current directory'));
      } else {
        console.log(theme.primary('  📍 Directory Bookmarks'));
        console.log('');
        for (const key of keys.sort()) {
          const exists = existsSync(bookmarks[key]);
          const status = exists ? theme.success(symbols.check) : theme.error(symbols.cross);
          console.log(`  ${status} ${theme.primary(key.padEnd(15))} ${theme.dim('→')} ${bookmarks[key]}`);
        }
      }
      break;
  }
  console.log('');
}

// Find files with colored output
function handleFind(args: string): void {
  const pattern = args.trim() || '*';
  const searchPath = process.cwd();
  const results: { path: string; isDir: boolean }[] = [];
  const maxResults = 50;

  function searchDir(dir: string, depth: number = 0): void {
    if (depth > 5 || results.length >= maxResults) return;

    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || ['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;

        const fullPath = resolve(dir, entry.name);
        const matchPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
        const regex = new RegExp(matchPattern, 'i');

        if (regex.test(entry.name)) {
          results.push({ path: fullPath, isDir: entry.isDirectory() });
        }

        if (entry.isDirectory() && results.length < maxResults) {
          searchDir(fullPath, depth + 1);
        }
      }
    } catch {}
  }

  console.log('');
  console.log(theme.dim(`  Searching for: ${pattern}`));
  console.log('');

  searchDir(searchPath);

  if (results.length === 0) {
    console.log(theme.dim('  No matches found'));
  } else {
    for (const result of results) {
      const relativePath = result.path.replace(searchPath, '.').replace(/\\/g, '/');
      const ext = result.isDir ? 'dir' : extname(result.path).toLowerCase();
      const iconInfo = fileIcons[ext] || fileIcons['default'];

      // Highlight matching part
      const fileName = basename(result.path);
      const dirPath = relativePath.slice(0, -fileName.length);

      console.log(`  ${iconInfo.icon} ${theme.dim(dirPath)}${chalk.hex(iconInfo.color)(fileName)}${result.isDir ? '/' : ''}`);
    }

    if (results.length >= maxResults) {
      console.log('');
      console.log(theme.dim(`  ... and more (showing first ${maxResults} results)`));
    }
  }
  console.log('');
}

// Disk usage with visual bars
function handleDu(args: string): void {
  const targetPath = args.trim() ? resolve(process.cwd(), args.trim()) : process.cwd();

  if (!existsSync(targetPath)) {
    console.log(theme.error(`  Path not found: ${targetPath}`));
    return;
  }

  interface DirSize {
    name: string;
    size: number;
    isDir: boolean;
    skipped?: boolean;
  }

  const items: DirSize[] = [];

  console.log('');
  console.log(theme.dim('  Calculating sizes...'));

  try {
    const entries = readdirSync(targetPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;

      const fullPath = resolve(targetPath, entry.name);
      let size = 0;
      let skipped = false;

      try {
        if (entry.isDirectory()) {
          if (skipDirs.has(entry.name)) {
            // Just get immediate size estimate for skipped dirs
            skipped = true;
            size = 0; // Mark as skipped
          } else {
            size = getDirSize(fullPath);
          }
        } else {
          size = statSync(fullPath).size;
        }
        items.push({ name: entry.name, size, isDir: entry.isDirectory(), skipped });
      } catch {}
    }
  } catch {
    console.log(theme.error(`  Cannot read: ${targetPath}`));
    return;
  }

  // Clear the "calculating" message
  process.stdout.write('\x1b[1A\x1b[2K');

  // Sort by size descending
  items.sort((a, b) => b.size - a.size);

  const totalSize = items.reduce((sum, item) => sum + item.size, 0);

  console.log('');
  console.log(theme.primary(`  📊 Disk Usage: ${basename(targetPath)}`));
  console.log(theme.dim(`  Total: ${formatSizeSimple(totalSize)}`));
  console.log('');

  const maxItems = 15;
  const skippedItems: string[] = [];

  for (let i = 0; i < Math.min(items.length, maxItems); i++) {
    const item = items[i];

    if (item.skipped) {
      skippedItems.push(item.name);
      continue;
    }

    const percent = totalSize > 0 ? (item.size / totalSize) * 100 : 0;
    const barWidth = 20;
    const filled = Math.round((percent / 100) * barWidth);

    const bar = chalk.hex('#4ECDC4')('█'.repeat(filled)) + chalk.dim('░'.repeat(barWidth - filled));
    const icon = item.isDir ? '📁' : '📄';
    const name = item.name.length > 25 ? item.name.slice(0, 22) + '...' : item.name.padEnd(25);

    console.log(`  ${icon} ${name} ${bar} ${formatSizeSimple(item.size).padStart(8)} ${chalk.dim(`${percent.toFixed(1)}%`)}`);
  }

  if (items.length > maxItems) {
    console.log(theme.dim(`  ... and ${items.length - maxItems} more items`));
  }

  if (skippedItems.length > 0) {
    console.log('');
    console.log(theme.dim(`  Skipped (large dirs): ${skippedItems.join(', ')}`));
  }
  console.log('');
}

// Directories to skip when calculating sizes
const skipDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'coverage', '.cache', '__pycache__', 'venv', '.venv']);

function getDirSize(dir: string, depth: number = 0, maxDepth: number = 4): number {
  if (depth > maxDepth) return 0;

  let size = 0;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      // Skip problematic directories
      if (skipDirs.has(entry.name)) continue;

      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        size += getDirSize(fullPath, depth + 1, maxDepth);
      } else {
        try {
          size += statSync(fullPath).size;
        } catch {}
      }
    }
  } catch {}
  return size;
}

function formatSizeSimple(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}

// Git status with nice formatting
function handleGit(args: string): void {
  const subcommand = args.trim().split(/\s+/)[0] || 'status';

  console.log('');

  try {
    // Check if in git repo
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe', timeout: 5000 });
  } catch {
    console.log(theme.error('  Not a git repository'));
    console.log('');
    return;
  }

  try {
    switch (subcommand) {
      case 'status':
      case 's': {
        const branch = execSync('git branch --show-current', { encoding: 'utf-8', timeout: 5000 }).trim();
        console.log(`  ${symbols.rocket} ${theme.primary('Branch:')} ${chalk.hex('#98C379')(branch)}`);
        console.log('');

        const status = execSync('git status --porcelain', { encoding: 'utf-8', timeout: 5000 });
        if (!status.trim()) {
          console.log(`  ${symbols.check} ${theme.success('Working tree clean')}`);
        } else {
          const lines = status.trim().split('\n');
          const staged: string[] = [];
          const modified: string[] = [];
          const untracked: string[] = [];

          for (const line of lines) {
            const [index, work] = [line[0], line[1]];
            const file = line.slice(3);

            if (index === 'A' || index === 'M' || index === 'D' || index === 'R') {
              staged.push(`${index} ${file}`);
            }
            if (work === 'M' || work === 'D') {
              modified.push(`${work} ${file}`);
            }
            if (index === '?' && work === '?') {
              untracked.push(file);
            }
          }

          if (staged.length > 0) {
            console.log(theme.success('  Staged changes:'));
            staged.forEach(f => console.log(`    ${symbols.check} ${chalk.hex('#98C379')(f)}`));
            console.log('');
          }

          if (modified.length > 0) {
            console.log(theme.warning('  Modified:'));
            modified.forEach(f => console.log(`    ${symbols.bullet} ${chalk.hex('#E5C07B')(f)}`));
            console.log('');
          }

          if (untracked.length > 0) {
            console.log(theme.dim('  Untracked:'));
            untracked.forEach(f => console.log(`    ${symbols.bullet} ${theme.dim(f)}`));
            console.log('');
          }
        }

        // Show recent commits
        const log = execSync('git log --oneline -3', { encoding: 'utf-8', timeout: 3000 }).trim();
        if (log) {
          console.log(theme.dim('  Recent commits:'));
          log.split('\n').forEach(line => {
            const [hash, ...msg] = line.split(' ');
            console.log(`    ${chalk.hex('#61AFEF')(hash)} ${theme.dim(msg.join(' '))}`);
          });
        }
        break;
      }

      case 'log':
      case 'l': {
        const log = execSync('git log --oneline -10', { encoding: 'utf-8', timeout: 3000 }).trim();
        console.log(theme.primary('  📜 Recent Commits'));
        console.log('');
        log.split('\n').forEach(line => {
          const [hash, ...msg] = line.split(' ');
          console.log(`  ${chalk.hex('#61AFEF')(hash)} ${msg.join(' ')}`);
        });
        break;
      }

      case 'branch':
      case 'b': {
        const branches = execSync('git branch -a', { encoding: 'utf-8', timeout: 3000 }).trim();
        console.log(theme.primary('  🌿 Branches'));
        console.log('');
        branches.split('\n').forEach(line => {
          if (line.startsWith('*')) {
            console.log(`  ${chalk.hex('#98C379')(line)}`);
          } else {
            console.log(`  ${theme.dim(line)}`);
          }
        });
        break;
      }

      default:
        // Pass through to git
        const result = execSync(`git ${args}`, { encoding: 'utf-8', timeout: 10000 });
        console.log(result);
    }
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string };
    console.log(theme.error(err.stderr || err.message || 'Git command failed'));
  }

  console.log('');
}

// Clipboard operations - cross-platform
const isMac = platform() === 'darwin';
const isLinux = platform() === 'linux';

function getClipboardCopyCmd(): string {
  if (isWindows) return 'clip';
  if (isMac) return 'pbcopy';
  // Linux - try xclip first, fall back to xsel
  try {
    execSync('which xclip', { stdio: 'pipe' });
    return 'xclip -selection clipboard';
  } catch {
    return 'xsel --clipboard --input';
  }
}

function getClipboardPasteCmd(): string {
  if (isWindows) return 'powershell -command "Get-Clipboard"';
  if (isMac) return 'pbpaste';
  // Linux
  try {
    execSync('which xclip', { stdio: 'pipe' });
    return 'xclip -selection clipboard -o';
  } catch {
    return 'xsel --clipboard --output';
  }
}

function handleClipboard(args: string): void {
  const parts = args.trim().split(/\s+/);
  const action = parts[0]?.toLowerCase();
  const content = parts.slice(1).join(' ');

  console.log('');

  if (action === 'copy' && content) {
    try {
      const copyCmd = getClipboardCopyCmd();
      if (isWindows) {
        execSync(`echo ${content} | ${copyCmd}`, { stdio: 'pipe', timeout: 3000 });
      } else {
        execSync(`echo "${content}" | ${copyCmd}`, { stdio: 'pipe', timeout: 3000 });
      }
      console.log(`  ${symbols.check} ${theme.success('Copied to clipboard')}`);
    } catch {
      console.log(theme.error('  Failed to copy to clipboard'));
      if (isLinux) {
        console.log(theme.dim('  (Install xclip or xsel: sudo apt install xclip)'));
      }
    }
  } else if (action === 'paste') {
    try {
      const pasteCmd = getClipboardPasteCmd();
      const result = execSync(pasteCmd, { encoding: 'utf-8', timeout: 3000 }).trim();
      console.log(`  ${symbols.clipboard} ${theme.dim('Clipboard contents:')}`);
      console.log('');
      console.log(result);
    } catch {
      console.log(theme.error('  Failed to read clipboard'));
      if (isLinux) {
        console.log(theme.dim('  (Install xclip or xsel: sudo apt install xclip)'));
      }
    }
  } else if (action === 'file' && parts[1]) {
    // Copy file contents to clipboard
    const filePath = resolve(process.cwd(), parts[1]);
    if (existsSync(filePath)) {
      try {
        const copyCmd = getClipboardCopyCmd();
        if (isWindows) {
          execSync(`type "${filePath}" | ${copyCmd}`, { stdio: 'pipe', timeout: 5000 });
        } else {
          execSync(`cat "${filePath}" | ${copyCmd}`, { stdio: 'pipe', timeout: 5000 });
        }
        console.log(`  ${symbols.check} ${theme.success('File contents copied to clipboard')}`);
      } catch {
        console.log(theme.error('  Failed to copy file to clipboard'));
        if (isLinux) {
          console.log(theme.dim('  (Install xclip or xsel: sudo apt install xclip)'));
        }
      }
    } else {
      console.log(theme.error(`  File not found: ${parts[1]}`));
    }
  } else {
    console.log(theme.primary('  📋 Clipboard Commands'));
    console.log('');
    console.log(`  ${theme.dim('clipboard copy <text>')}  ${theme.dim('-')} Copy text to clipboard`);
    console.log(`  ${theme.dim('clipboard paste')}        ${theme.dim('-')} Show clipboard contents`);
    console.log(`  ${theme.dim('clipboard file <path>')}  ${theme.dim('-')} Copy file contents to clipboard`);
    if (isLinux) {
      console.log('');
      console.log(theme.dim('  Note: Requires xclip or xsel on Linux'));
    }
  }

  console.log('');
}

// JSON/YAML pretty printer
function handlePretty(args: string): void {
  const filePath = resolve(process.cwd(), args.trim());

  if (!existsSync(filePath)) {
    console.log(theme.error(`  File not found: ${args}`));
    return;
  }

  console.log('');

  try {
    const content = readFileSync(filePath, 'utf-8');
    const ext = extname(filePath).toLowerCase();

    if (ext === '.json') {
      const parsed = JSON.parse(content);
      const pretty = JSON.stringify(parsed, null, 2);
      console.log(highlightJson(pretty));
    } else {
      // For YAML or other files, just format nicely
      console.log(content);
    }
  } catch (error) {
    console.log(theme.error(`  Failed to parse: ${args}`));
    console.log(theme.dim(`  ${error}`));
  }

  console.log('');
}

function highlightJson(json: string): string {
  return json
    .replace(/"([^"]+)":/g, (_, key) => chalk.hex('#E06C75')(`"${key}"`) + ':')
    .replace(/: "([^"]*)"/g, (_, val) => ': ' + chalk.hex('#98C379')(`"${val}"`))
    .replace(/: (\d+)/g, (_, num) => ': ' + chalk.hex('#D19A66')(num))
    .replace(/: (true|false)/g, (_, bool) => ': ' + chalk.hex('#56B6C2')(bool))
    .replace(/: (null)/g, (_, n) => ': ' + chalk.hex('#C678DD')(n));
}

// File watcher (tail -f equivalent)
let activeWatcher: string | null = null;

function handleWatch(args: string): void {
  const parts = args.trim().split(/\s+/);
  const action = parts[0];

  console.log('');

  if (action === 'stop') {
    if (activeWatcher) {
      unwatchFile(activeWatcher);
      console.log(`  ${symbols.check} ${theme.success('Stopped watching:')} ${activeWatcher}`);
      activeWatcher = null;
    } else {
      console.log(theme.dim('  No active watcher'));
    }
    console.log('');
    return;
  }

  if (!action) {
    console.log(theme.primary('  👁️ File Watcher'));
    console.log('');
    console.log(`  ${theme.dim('Usage:')}`);
    console.log(`    ${theme.dim('watch <file>')}  ${theme.dim('-')} Watch file for changes`);
    console.log(`    ${theme.dim('watch stop')}    ${theme.dim('-')} Stop watching`);
    if (activeWatcher) {
      console.log('');
      console.log(`  ${theme.dim('Currently watching:')} ${activeWatcher}`);
    }
    console.log('');
    return;
  }

  const filePath = resolve(process.cwd(), action);

  if (!existsSync(filePath)) {
    console.log(theme.error(`  File not found: ${action}`));
    console.log('');
    return;
  }

  // Check if it's a file, not a directory
  try {
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      console.log(theme.error(`  Cannot watch a directory: ${action}`));
      console.log(theme.dim('  Please specify a file path'));
      console.log('');
      return;
    }
  } catch {
    console.log(theme.error(`  Cannot access: ${action}`));
    console.log('');
    return;
  }

  if (activeWatcher) {
    unwatchFile(activeWatcher);
  }

  activeWatcher = filePath;
  let lastSize = statSync(filePath).size;

  console.log(`  ${symbols.info} ${theme.primary('Watching:')} ${filePath}`);
  console.log(theme.dim('  (Type "!watch stop" to stop watching)'));
  console.log('');

  // Show last 10 lines initially
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').slice(-10);
    lines.forEach(line => console.log(theme.dim(line)));
  } catch {
    console.log(theme.dim('  (Unable to read initial content)'));
  }

  watchFile(filePath, { interval: 500 }, (curr, prev) => {
    if (curr.size > lastSize) {
      try {
        const newContent = readFileSync(filePath, 'utf-8');
        const allLines = newContent.split('\n');
        const oldLines = Math.floor(prev.size / 50); // approximate
        const newLines = allLines.slice(-Math.max(1, allLines.length - oldLines));
        newLines.forEach(line => {
          if (line.trim()) console.log(chalk.hex('#98C379')(line));
        });
      } catch {}
    }
    lastSize = curr.size;
  });
}

// Quick http server
function handleServe(args: string): void {
  const port = parseInt(args.trim()) || 3000;

  console.log('');
  console.log(`  ${symbols.rocket} ${theme.primary('Starting HTTP server...')}`);
  console.log(`  ${theme.dim('Serving:')} ${process.cwd()}`);
  console.log(`  ${theme.dim('URL:')} ${chalk.hex('#61AFEF')(`http://localhost:${port}`)}`);
  console.log('');
  console.log(theme.dim('  Press Ctrl+C to stop'));
  console.log('');

  try {
    const npx = isWindows ? 'npx.cmd' : 'npx';
    spawn(npx, ['serve', '-p', String(port)], {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
  } catch {
    console.log(theme.error('  Failed to start server. Make sure "serve" is available.'));
  }
}

// Process list
function handlePs(): void {
  console.log('');
  console.log(theme.primary('  ⚡ Running Processes'));
  console.log('');

  try {
    let result: string;
    if (isWindows) {
      result = execSync('tasklist /FO CSV /NH | findstr /V "System Idle"', { encoding: 'utf-8', timeout: 5000 });
      const lines = result.trim().split('\n').slice(0, 15);
      console.log(theme.dim('  Name                          PID       Memory'));
      console.log(theme.dim('  ─'.repeat(25)));
      lines.forEach(line => {
        const parts = line.split('","').map(p => p.replace(/"/g, ''));
        if (parts.length >= 5) {
          const name = parts[0].slice(0, 28).padEnd(30);
          const pid = parts[1].padStart(8);
          const mem = parts[4];
          console.log(`  ${name}${pid}  ${chalk.hex('#98C379')(mem)}`);
        }
      });
    } else {
      result = execSync('ps aux | head -15', { encoding: 'utf-8', timeout: 5000 });
      console.log(result);
    }
  } catch {
    console.log(theme.error('  Failed to get process list'));
  }

  console.log('');
}

// Environment variables viewer
function handleEnv(args: string): void {
  const filter = args.trim().toLowerCase();

  console.log('');
  console.log(theme.primary('  🔐 Environment Variables'));
  console.log('');

  const env = process.env;
  const keys = Object.keys(env).sort();
  const filtered = filter ? keys.filter(k => k.toLowerCase().includes(filter)) : keys;

  if (filtered.length === 0) {
    console.log(theme.dim(`  No variables matching: ${filter}`));
  } else {
    const maxShow = 30;
    filtered.slice(0, maxShow).forEach(key => {
      const value = env[key] || '';
      const displayValue = value.length > 50 ? value.slice(0, 47) + '...' : value;
      console.log(`  ${chalk.hex('#E06C75')(key.padEnd(25))} ${theme.dim('=')} ${displayValue}`);
    });

    if (filtered.length > maxShow) {
      console.log(theme.dim(`  ... and ${filtered.length - maxShow} more`));
    }
  }

  console.log('');
}

// IP address command
function handleIp(): void {
  console.log('');
  console.log(theme.primary('  🌐 Network Information'));
  console.log('');

  try {
    // Local IP
    const nets = networkInterfaces();
    const localIps: string[] = [];

    for (const name of Object.keys(nets)) {
      const netList = nets[name];
      if (!netList) continue;
      for (const net of netList) {
        // Handle both Node.js formats (family can be 'IPv4' string or 4 number)
        const isIPv4 = net.family === 'IPv4' || (net as any).family === 4;
        if (isIPv4 && !net.internal) {
          localIps.push(`${name}: ${net.address}`);
        }
      }
    }

    console.log(theme.dim('  Local IP:'));
    if (localIps.length === 0) {
      console.log(`    ${theme.dim('(No network interfaces found)')}`);
    } else {
      localIps.forEach(ip => console.log(`    ${chalk.hex('#98C379')(ip)}`));
    }

    // Public IP (async fetch)
    console.log('');
    console.log(theme.dim('  Public IP:'));
    try {
      // Try curl first, then PowerShell on Windows
      let result: string;
      try {
        result = execSync('curl -s ifconfig.me', { encoding: 'utf-8', timeout: 5000 }).trim();
      } catch {
        if (isWindows) {
          result = execSync('powershell -command "(Invoke-WebRequest -Uri ifconfig.me -UseBasicParsing).Content"', { encoding: 'utf-8', timeout: 5000 }).trim();
        } else {
          throw new Error('curl not available');
        }
      }
      console.log(`    ${chalk.hex('#61AFEF')(result)}`);
    } catch {
      console.log(`    ${theme.dim('(Could not fetch - requires curl or internet)')}`);
    }
  } catch (error) {
    console.log(theme.error('  Failed to get network info'));
  }

  console.log('');
}

// Epoch/timestamp converter
function handleEpoch(args: string): void {
  const input = args.trim();

  console.log('');
  console.log(theme.primary('  ⏰ Timestamp Converter'));
  console.log('');

  if (!input || input === 'now') {
    // Current time
    const now = new Date();
    console.log(`  ${theme.dim('Current Time:')}`);
    console.log(`    ${chalk.hex('#98C379')(now.toISOString())}`);
    console.log(`    ${chalk.hex('#61AFEF')(Math.floor(now.getTime() / 1000).toString())} ${theme.dim('(Unix seconds)')}`);
    console.log(`    ${chalk.hex('#E5C07B')(now.getTime().toString())} ${theme.dim('(Unix milliseconds)')}`);
  } else if (/^\d{10,13}$/.test(input)) {
    // Epoch to date
    const ms = input.length === 10 ? parseInt(input) * 1000 : parseInt(input);
    const date = new Date(ms);
    console.log(`  ${theme.dim('Epoch:')} ${chalk.hex('#E5C07B')(input)}`);
    console.log(`  ${theme.dim('Date:')}  ${chalk.hex('#98C379')(date.toISOString())}`);
    console.log(`         ${chalk.hex('#98C379')(date.toLocaleString())}`);
  } else {
    // Try to parse as date string
    const date = new Date(input);
    if (!isNaN(date.getTime())) {
      console.log(`  ${theme.dim('Date:')}  ${chalk.hex('#98C379')(input)}`);
      console.log(`  ${theme.dim('Unix:')}  ${chalk.hex('#61AFEF')(Math.floor(date.getTime() / 1000).toString())} ${theme.dim('(seconds)')}`);
      console.log(`         ${chalk.hex('#E5C07B')(date.getTime().toString())} ${theme.dim('(milliseconds)')}`);
    } else {
      console.log(theme.error(`  Cannot parse: ${input}`));
      console.log(theme.dim('  Examples: epoch now, epoch 1703788800, epoch "2024-01-01"'));
    }
  }

  console.log('');
}

// Quick HTTP client
async function handleHttp(args: string): Promise<void> {
  const parts = args.trim().split(/\s+/);
  const method = (parts[0] || 'GET').toUpperCase();
  const url = parts[1];

  console.log('');

  if (!url) {
    console.log(theme.primary('  🔗 HTTP Client'));
    console.log('');
    console.log(`  ${theme.dim('Usage:')}`);
    console.log(`    ${theme.dim('http GET <url>')}    ${theme.dim('-')} Make GET request`);
    console.log(`    ${theme.dim('http POST <url>')}   ${theme.dim('-')} Make POST request`);
    console.log(`    ${theme.dim('http HEAD <url>')}   ${theme.dim('-')} Get headers only`);
    console.log('');
    return;
  }

  const fullUrl = url.startsWith('http') ? url : `https://${url}`;

  console.log(`  ${symbols.rocket} ${theme.dim(method)} ${chalk.hex('#61AFEF')(fullUrl)}`);
  console.log('');

  try {
    let result: string;

    // Try curl first
    try {
      const curlCmd = method === 'HEAD'
        ? `curl -sI "${fullUrl}"`
        : `curl -s -X ${method} "${fullUrl}"`;
      result = execSync(curlCmd, { encoding: 'utf-8', timeout: 10000 });
    } catch {
      // Fallback to PowerShell on Windows
      if (isWindows) {
        if (method === 'HEAD') {
          result = execSync(`powershell -command "(Invoke-WebRequest -Uri '${fullUrl}' -Method Head -UseBasicParsing).Headers | ConvertTo-Json"`, { encoding: 'utf-8', timeout: 10000 });
        } else {
          result = execSync(`powershell -command "(Invoke-WebRequest -Uri '${fullUrl}' -Method ${method} -UseBasicParsing).Content"`, { encoding: 'utf-8', timeout: 10000 });
        }
      } else {
        throw new Error('curl not available');
      }
    }

    if (result.trim().startsWith('{') || result.trim().startsWith('[')) {
      // JSON response - pretty print
      try {
        const parsed = JSON.parse(result);
        console.log(highlightJson(JSON.stringify(parsed, null, 2)));
      } catch {
        console.log(result);
      }
    } else {
      // Show first 50 lines
      const lines = result.split('\n').slice(0, 50);
      lines.forEach(line => console.log(line));
      if (result.split('\n').length > 50) {
        console.log(theme.dim('  ... (output truncated)'));
      }
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.log(theme.error(`  Request failed: ${err.message || 'Unknown error'}`));
  }

  console.log('');
}

// Visual diff command
function handleDiff(args: string): void {
  const parts = args.trim().split(/\s+/);
  const file1 = parts[0];
  const file2 = parts[1];

  console.log('');

  if (!file1 || !file2) {
    console.log(theme.primary('  📝 Diff Tool'));
    console.log('');
    console.log(`  ${theme.dim('Usage: diff <file1> <file2>')}`);
    console.log('');
    return;
  }

  const path1 = resolve(process.cwd(), file1);
  const path2 = resolve(process.cwd(), file2);

  if (!existsSync(path1)) {
    console.log(theme.error(`  File not found: ${file1}`));
    console.log('');
    return;
  }
  if (!existsSync(path2)) {
    console.log(theme.error(`  File not found: ${file2}`));
    console.log('');
    return;
  }

  try {
    const content1 = readFileSync(path1, 'utf-8').split('\n');
    const content2 = readFileSync(path2, 'utf-8').split('\n');

    console.log(theme.primary(`  Comparing: ${basename(file1)} ↔ ${basename(file2)}`));
    console.log('');

    const maxLines = Math.max(content1.length, content2.length);
    let differences = 0;

    for (let i = 0; i < Math.min(maxLines, 100); i++) {
      const line1 = content1[i] || '';
      const line2 = content2[i] || '';

      if (line1 !== line2) {
        differences++;
        console.log(chalk.hex('#E06C75')(`  - ${(i + 1).toString().padStart(4)}: ${line1.slice(0, 70)}`));
        console.log(chalk.hex('#98C379')(`  + ${(i + 1).toString().padStart(4)}: ${line2.slice(0, 70)}`));
        console.log('');
      }
    }

    if (differences === 0) {
      console.log(`  ${symbols.check} ${theme.success('Files are identical')}`);
    } else {
      console.log(theme.dim(`  Found ${differences} different line(s)`));
    }

    if (maxLines > 100) {
      console.log(theme.dim(`  (Showing first 100 lines)`));
    }
  } catch (error) {
    console.log(theme.error('  Failed to compare files'));
  }

  console.log('');
}

// Command aliases storage
const aliasesFile = join(homedir(), '.zammy-aliases.json');

function loadAliases(): Record<string, string> {
  try {
    if (existsSync(aliasesFile)) {
      return JSON.parse(readFileSync(aliasesFile, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveAliases(aliases: Record<string, string>): void {
  writeFileSync(aliasesFile, JSON.stringify(aliases, null, 2));
}

function handleAlias(args: string): void {
  const parts = args.trim().split(/\s+/);
  const action = parts[0]?.toLowerCase();
  const name = parts[1];
  const command = parts.slice(2).join(' ');

  const aliases = loadAliases();

  console.log('');

  if (action === 'add' || action === 'set') {
    if (!name || !command) {
      console.log(theme.error('  Usage: alias add <name> <command>'));
    } else {
      aliases[name] = command;
      saveAliases(aliases);
      console.log(`  ${symbols.check} ${theme.success('Alias created:')} ${theme.primary(name)} ${theme.dim('→')} ${command}`);
    }
  } else if (action === 'del' || action === 'rm') {
    if (!name || !aliases[name]) {
      console.log(theme.error(`  Alias not found: ${name}`));
    } else {
      delete aliases[name];
      saveAliases(aliases);
      console.log(`  ${symbols.check} ${theme.success('Alias deleted:')} ${theme.primary(name)}`);
    }
  } else if (action === 'run' && name) {
    if (aliases[name]) {
      console.log(theme.dim(`  Running: ${aliases[name]}`));
      console.log('');
      try {
        const result = execSync(aliases[name], { encoding: 'utf-8', cwd: process.cwd(), timeout: 30000 });
        console.log(result);
      } catch (error: unknown) {
        const err = error as { stderr?: string; killed?: boolean };
        if (err.killed) {
          console.log(theme.error('  Command timed out (30s limit)'));
        } else {
          console.log(theme.error(err.stderr || 'Command failed'));
        }
      }
    } else {
      console.log(theme.error(`  Alias not found: ${name}`));
    }
  } else {
    // List aliases
    const keys = Object.keys(aliases);
    if (keys.length === 0) {
      console.log(theme.dim('  No aliases defined'));
      console.log(theme.dim('  Use "alias add <name> <command>" to create one'));
    } else {
      console.log(theme.primary('  ⚡ Command Aliases'));
      console.log('');
      for (const key of keys.sort()) {
        console.log(`  ${theme.primary(key.padEnd(15))} ${theme.dim('→')} ${aliases[key]}`);
      }
    }
  }

  console.log('');
}

// Desktop notifications
function handleNotify(args: string): void {
  const message = args.trim() || 'Notification from Zammy CLI';

  console.log('');

  try {
    if (isWindows) {
      // Use PowerShell for Windows notifications
      const ps = `
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
        $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText01)
        $template.GetElementsByTagName("text").Item(0).AppendChild($template.CreateTextNode("${message.replace(/"/g, '\\"')}")) | Out-Null
        $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Zammy CLI")
        $notifier.Show([Windows.UI.Notifications.ToastNotification]::new($template))
      `;
      execSync(`powershell -command "${ps.replace(/\n/g, ' ')}"`, { stdio: 'pipe', timeout: 5000 });
    } else {
      // Use notify-send on Linux, osascript on Mac
      const cmd = platform() === 'darwin'
        ? `osascript -e 'display notification "${message}" with title "Zammy CLI"'`
        : `notify-send "Zammy CLI" "${message}"`;
      execSync(cmd, { stdio: 'pipe', timeout: 3000 });
    }
    console.log(`  ${symbols.check} ${theme.success('Notification sent')}`);
  } catch {
    // Fallback: just print to console with bell
    console.log('\x07'); // Bell sound
    console.log(`  ${symbols.bell} ${theme.primary(message)}`);
  }

  console.log('');
}

// Quick grep (search in files)
function handleGrep(args: string): void {
  const parts = args.trim().split(/\s+/);
  const pattern = parts[0];
  const filePattern = parts[1] || '*';

  console.log('');

  if (!pattern) {
    console.log(theme.primary('  🔍 Search in Files'));
    console.log('');
    console.log(`  ${theme.dim('Usage: grep <pattern> [file-pattern]')}`);
    console.log(`  ${theme.dim('Example: grep TODO *.ts')}`);
    console.log('');
    return;
  }

  console.log(theme.dim(`  Searching for: ${pattern}`));
  console.log('');

  const results: { file: string; line: number; content: string }[] = [];
  const regex = new RegExp(pattern, 'i');
  const maxResults = 30;

  function searchFile(filePath: string): void {
    if (results.length >= maxResults) return;

    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (results.length >= maxResults) return;
        if (regex.test(line)) {
          results.push({
            file: filePath.replace(process.cwd(), '.').replace(/\\/g, '/'),
            line: index + 1,
            content: line.trim().slice(0, 80),
          });
        }
      });
    } catch {}
  }

  function searchDir(dir: string, depth: number = 0): void {
    if (depth > 4 || results.length >= maxResults) return;

    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (results.length >= maxResults) break;
        if (entry.name.startsWith('.') || ['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;

        const fullPath = resolve(dir, entry.name);

        if (entry.isDirectory()) {
          searchDir(fullPath, depth + 1);
        } else {
          const fileExt = extname(entry.name);
          const filePatternRegex = new RegExp(filePattern.replace(/\*/g, '.*'), 'i');
          if (filePatternRegex.test(entry.name) || filePattern === '*') {
            if (['.ts', '.js', '.tsx', '.jsx', '.json', '.md', '.txt', '.css', '.html', '.py', '.go', '.rs'].includes(fileExt)) {
              searchFile(fullPath);
            }
          }
        }
      }
    } catch {}
  }

  searchDir(process.cwd());

  if (results.length === 0) {
    console.log(theme.dim('  No matches found'));
  } else {
    for (const result of results) {
      const highlightedContent = result.content.replace(
        regex,
        match => chalk.hex('#FF6B6B').bold(match)
      );
      console.log(`  ${theme.dim(result.file)}:${chalk.hex('#61AFEF')(result.line)}`);
      console.log(`    ${highlightedContent}`);
      console.log('');
    }

    if (results.length >= maxResults) {
      console.log(theme.dim(`  ... showing first ${maxResults} results`));
    }
  }

  console.log('');
}

// Word/line count
function handleWc(args: string): void {
  const filePath = resolve(process.cwd(), args.trim());

  console.log('');

  if (!args.trim()) {
    console.log(theme.error('  Usage: wc <file>'));
    console.log('');
    return;
  }

  if (!existsSync(filePath)) {
    console.log(theme.error(`  File not found: ${args}`));
    console.log('');
    return;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(w => w.length > 0).length;
    const chars = content.length;
    const bytes = Buffer.byteLength(content, 'utf-8');

    console.log(theme.primary(`  📊 ${basename(args)}`));
    console.log('');
    console.log(`  ${chalk.hex('#61AFEF')(lines.toLocaleString().padStart(8))} ${theme.dim('lines')}`);
    console.log(`  ${chalk.hex('#98C379')(words.toLocaleString().padStart(8))} ${theme.dim('words')}`);
    console.log(`  ${chalk.hex('#E5C07B')(chars.toLocaleString().padStart(8))} ${theme.dim('characters')}`);
    console.log(`  ${chalk.hex('#C678DD')(bytes.toLocaleString().padStart(8))} ${theme.dim('bytes')}`);
  } catch {
    console.log(theme.error('  Failed to read file'));
  }

  console.log('');
}

// Head command (first N lines)
function handleHead(args: string): void {
  const parts = args.trim().split(/\s+/);
  let lines = 10;
  let filePath = parts[0];

  if (parts[0] === '-n' && parts[1]) {
    lines = parseInt(parts[1]) || 10;
    filePath = parts[2];
  }

  console.log('');

  if (!filePath) {
    console.log(theme.error('  Usage: head [-n <lines>] <file>'));
    console.log('');
    return;
  }

  const fullPath = resolve(process.cwd(), filePath);

  if (!existsSync(fullPath)) {
    console.log(theme.error(`  File not found: ${filePath}`));
    console.log('');
    return;
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');
    const fileLines = content.split('\n').slice(0, lines);
    console.log(theme.dim(`  First ${lines} lines of ${basename(filePath)}:`));
    console.log('');
    fileLines.forEach((line, i) => {
      console.log(`  ${chalk.dim((i + 1).toString().padStart(4))} ${line}`);
    });
  } catch {
    console.log(theme.error('  Failed to read file'));
  }

  console.log('');
}

async function executeShellCommand(command: string): Promise<void> {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  // Handle special commands that need Node.js
  if (cmd === 'cd') {
    handleCd(args);
    return;
  }

  if (cmd === 'pwd') {
    handlePwd();
    return;
  }

  if (cmd === 'cat' || cmd === 'type') {
    handleCat(args);
    return;
  }

  if (cmd === 'ls' || cmd === 'dir') {
    handleLs(args);
    return;
  }

  if (cmd === 'tree') {
    handleTree(args);
    return;
  }

  if (cmd === 'clear' || cmd === 'cls') {
    // Full terminal reset - clear screen and scrollback buffer
    process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
    const isSimple = process.argv.includes('--simple') || !process.stdout.isTTY;
    await displayBanner(isSimple);
    return;
  }

  // Enhanced shell commands
  if (cmd === 'bookmark' || cmd === 'bm') {
    handleBookmark(args);
    return;
  }

  if (cmd === 'find' || cmd === 'search') {
    handleFind(args);
    return;
  }

  if (cmd === 'du' || cmd === 'diskusage') {
    handleDu(args);
    return;
  }

  if (cmd === 'git' || cmd === 'g') {
    handleGit(args);
    return;
  }

  if (cmd === 'clipboard' || cmd === 'cb') {
    handleClipboard(args);
    return;
  }

  if (cmd === 'pretty' || cmd === 'json') {
    handlePretty(args);
    return;
  }

  if (cmd === 'watch' || cmd === 'tail') {
    handleWatch(args);
    return;
  }

  if (cmd === 'serve' || cmd === 'http') {
    handleServe(args);
    return;
  }

  if (cmd === 'ps' || cmd === 'processes') {
    handlePs();
    return;
  }

  if (cmd === 'env') {
    handleEnv(args);
    return;
  }

  if (cmd === 'ip' || cmd === 'ipaddr') {
    handleIp();
    return;
  }

  if (cmd === 'epoch' || cmd === 'timestamp' || cmd === 'time') {
    handleEpoch(args);
    return;
  }

  if (cmd === 'http' || cmd === 'curl' || cmd === 'fetch') {
    await handleHttp(args);
    return;
  }

  if (cmd === 'diff' || cmd === 'compare') {
    handleDiff(args);
    return;
  }

  if (cmd === 'alias') {
    handleAlias(args);
    return;
  }

  if (cmd === 'notify' || cmd === 'alert') {
    handleNotify(args);
    return;
  }

  if (cmd === 'grep' || cmd === 'rg') {
    handleGrep(args);
    return;
  }

  if (cmd === 'wc' || cmd === 'count') {
    handleWc(args);
    return;
  }

  if (cmd === 'head') {
    handleHead(args);
    return;
  }

  // Translate Linux → Windows if needed
  const translatedCmd = translateCommand(command);

  return new Promise((resolvePromise) => {
    const child = exec(translatedCmd, { cwd: process.cwd(), timeout: 30000 }, (error, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr) console.log(theme.error(stderr));
      if (error && !stderr) {
        if (error.killed) {
          console.log(theme.error('Command timed out (30s limit)'));
        } else {
          console.log(theme.error(`Error: ${error.message}`));
        }
      }
      resolvePromise();
    });

    // Allow Ctrl+C to kill the process
    process.on('SIGINT', () => {
      child.kill('SIGINT');
    });
  });
}

export async function parseAndExecute(input: string): Promise<void> {
  const trimmed = input.trim();

  if (!trimmed) {
    return;
  }

  // Shell command (starts with !)
  if (trimmed.startsWith('!')) {
    const shellCmd = trimmed.slice(1).trim();
    if (!shellCmd) {
      console.log(theme.dim('Usage: !<command> (e.g., !ls, !cd folder, !cat file.txt)'));
      return;
    }
    await executeShellCommand(shellCmd);
    return;
  }

  // Check if it's a command (starts with /)
  if (!trimmed.startsWith('/')) {
    // Check for keyword-based mood reactions
    const detectedMood = getMoodFromText(trimmed);
    if (detectedMood) {
      console.log('');
      const responses: Record<string, string[]> = {
        love: ["Aww, you're sweet!", "Right back at ya!", "*happy wobble*"],
        excited: ["Yay! Let's gooo!", "Woohoo!", "*bounces excitedly*"],
        sleepy: ["*yawns* Same...", "Maybe take a break?", "zzZ..."],
        sad: ["Aww, it's okay!", "I'm here for you!", "*comforting wobble*"],
        angry: ["*hides nervously*", "Let's fix that!", "Deep breaths..."],
        thinking: ["Hmm indeed...", "Let me think too...", "*ponders*"],
      };
      const moodResponses = responses[detectedMood] || ["*wobbles*"];
      const response = moodResponses[Math.floor(Math.random() * moodResponses.length)];

      // Love and excited: 50% chance for full mascot (only for short simple inputs)
      const isSimpleInput = trimmed.length < 20 && !/[{}\[\]();=<>]/.test(trimmed);
      if ((detectedMood === 'love' || detectedMood === 'excited') && isSimpleInput && Math.random() < 0.5) {
        showMascot(detectedMood);
        console.log(`  ${theme.secondary(response)}`);
      } else {
        react(detectedMood, theme.secondary(response));
      }
      console.log('');
      return;
    }

    console.log('');
    console.log(`  ${symbols.info} ${theme.dim('Commands start with')} ${theme.primary('/')} ${theme.dim('• Shell commands start with')} ${theme.primary('!')}`);
    console.log(`  ${theme.dim('   Type')} ${theme.primary('/help')} ${theme.dim('for available commands')}`);
    console.log('');
    return;
  }

  // Parse command and arguments
  const parts = trimmed.slice(1).split(/\s+/);
  const commandName = parts[0].toLowerCase();
  const args = parts.slice(1);

  const command = getCommand(commandName);

  if (!command) {
    console.log('');
    console.log(`  ${symbols.cross} ${theme.error('Unknown command:')} ${theme.dim('/' + commandName)}`);
    console.log(`  ${theme.dim('   Type')} ${theme.primary('/help')} ${theme.dim('to see all commands')}`);
    console.log('');
    return;
  }

  try {
    await command.execute(args);
    // Success reaction (occasional, not every time)
    if (Math.random() < 0.15) {
      const successMoods = ['happy', 'excited', 'wink'] as const;
      const mood = successMoods[Math.floor(Math.random() * successMoods.length)];
      react(mood);
    }
  } catch (error) {
    console.log('');
    react('sad', theme.error(`Error: ${String(error)}`));
    console.log('');
  }
}
