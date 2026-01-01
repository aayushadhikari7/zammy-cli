import { registerCommand } from '../registry.js';
import { theme, symbols, progressBar } from '../../ui/colors.js';
import { getSize, formatBytes, findLargestFiles } from '../../handlers/utilities/size.js';
import { resolve } from 'path';

registerCommand({
  name: 'size',
  description: 'Analyze file/folder sizes',
  usage: '/size [path] [--top N]',
  async execute(args: string[]) {
    const targetPath = args[0] || '.';
    const absPath = resolve(targetPath);

    // Check for --top flag
    const topIndex = args.indexOf('--top');
    const showTop = topIndex !== -1 ? parseInt(args[topIndex + 1]) || 10 : 0;

    console.log('');

    if (showTop > 0) {
      // Show largest files
      console.log(`  ${symbols.sparkle} ${theme.gradient('LARGEST FILES')}`);
      console.log(`  ${theme.dim(`in ${absPath}`)}`);
      console.log('');

      const largestFiles = findLargestFiles(absPath, showTop);

      if (largestFiles.length === 0) {
        console.log(`  ${theme.dim('No files found')}`);
      } else {
        const maxSize = largestFiles[0].size;

        for (let i = 0; i < largestFiles.length; i++) {
          const file = largestFiles[i];
          const percent = (file.size / maxSize) * 100;
          const bar = progressBar(percent, 20);
          const relativePath = file.path.replace(absPath, '.').replace(/\\/g, '/');

          console.log(
            `  ${theme.dim(`${(i + 1).toString().padStart(2)}.`)} ` +
            `${bar} ` +
            `${theme.primary(formatBytes(file.size).padStart(10))} ` +
            `${relativePath}`
          );
        }
      }

      console.log('');
      return;
    }

    // Show size of path
    const info = getSize(absPath);

    if (!info) {
      console.log(`  ${symbols.cross} ${theme.error(`Path not found: ${absPath}`)}`);
      console.log('');
      return;
    }

    console.log(`  ${symbols.sparkle} ${theme.gradient('SIZE ANALYSIS')}`);
    console.log(`  ${theme.dim(absPath)}`);
    console.log('');

    if (!info.isDirectory) {
      // Single file
      console.log(`  ${theme.primary(info.name)}: ${theme.success(formatBytes(info.size))}`);
    } else {
      // Directory
      console.log(`  ${theme.secondary('Total:')} ${theme.success(formatBytes(info.size))}`);
      console.log('');

      if (info.children && info.children.length > 0) {
        const maxSize = info.children[0].size;
        const displayCount = Math.min(15, info.children.length);

        for (let i = 0; i < displayCount; i++) {
          const child = info.children[i];
          const percent = (child.size / maxSize) * 100;
          const bar = progressBar(percent, 15);
          const icon = child.isDirectory ? symbols.folder : symbols.bullet;

          console.log(
            `  ${bar} ` +
            `${theme.primary(formatBytes(child.size).padStart(10))} ` +
            `${icon} ${child.name}`
          );
        }

        if (info.children.length > displayCount) {
          console.log('');
          console.log(`  ${theme.dim(`... and ${info.children.length - displayCount} more items`)}`);
        }
      } else {
        console.log(`  ${theme.dim('Directory is empty')}`);
      }
    }

    console.log('');
    console.log(`  ${theme.dim('Tip: /size . --top 10 shows largest files')}`);
    console.log('');
  },
});
