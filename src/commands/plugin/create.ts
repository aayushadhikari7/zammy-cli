import { theme, symbols } from '../../ui/colors.js';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { prompt } from '../../ui/input.js';

// Generate manifest template
function generateManifest(name: string, displayName: string, description: string, commandName: string): string {
  return JSON.stringify({
    name,
    version: '1.0.0',
    displayName,
    description,
    main: './dist/index.js',
    commands: [commandName],
    zammy: {
      minVersion: '1.3.0',
    },
    permissions: {},
  }, null, 2);
}

// Generate package.json
function generatePackageJson(name: string, description: string): string {
  return JSON.stringify({
    name,
    version: '1.0.0',
    description,
    type: 'module',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    scripts: {
      build: 'tsc',
      dev: 'tsc --watch',
    },
    keywords: ['zammy-plugin', 'zammy', 'cli', 'plugin'],
    peerDependencies: {
      zammy: '^1.3.0',
    },
    devDependencies: {
      zammy: '^1.3.0',
      typescript: '^5.3.0',
    },
  }, null, 2);
}

// Generate tsconfig.json
function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      declaration: true,
    },
    include: ['src/**/*'],
  }, null, 2);
}

// Generate main entry point
function generateEntryPoint(commandName: string, displayName: string): string {
  return `// ${displayName} - A zammy plugin

import type { PluginAPI, ZammyPlugin } from 'zammy/plugins';

const plugin: ZammyPlugin = {
  activate(api: PluginAPI) {
    const { theme, symbols } = api.ui;

    api.registerCommand({
      name: '${commandName}',
      description: 'My custom command',
      usage: '/${commandName} [args]',
      async execute(args: string[]) {
        console.log('');
        console.log(\`  \${symbols.star} \${theme.gradient('${displayName.toUpperCase()}')}\`);
        console.log('');
        console.log(\`  \${theme.success('Hello from ${displayName}!')}\`);

        if (args.length > 0) {
          console.log(\`  \${theme.dim('Arguments:')} \${args.join(' ')}\`);
        }

        console.log('');
      },
    });

    api.log.info('Plugin activated!');
  },

  deactivate() {
    // Cleanup if needed
  },
};

export default plugin;
`;
}

// Generate README
function generateReadme(name: string, displayName: string, description: string, commandName: string): string {
  return `# ${displayName}

${description}

## Installation

\`\`\`bash
/plugin install ./${name}
\`\`\`

## Usage

\`\`\`bash
/${commandName} [args]
\`\`\`

## Development

\`\`\`bash
# Build the plugin
npm run build

# Watch for changes
npm run dev
\`\`\`

## License

MIT
`;
}

export async function createPlugin(args: string[]): Promise<void> {
  console.log('');
  console.log(`  ${symbols.sparkle} ${theme.gradient('CREATE NEW PLUGIN')}`);
  console.log('');

  // Get plugin details
  let name = args[0] || '';

  if (!name) {
    name = await prompt('Plugin name (e.g., my-plugin)', 'zammy-plugin-example');
  }

  // Normalize name
  name = name.toLowerCase().replace(/\s+/g, '-');
  if (!name.startsWith('zammy-plugin-')) {
    // Don't force prefix, but suggest it
  }

  const displayName = await prompt('Display name', name.replace(/^zammy-plugin-/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
  const description = await prompt('Description', 'A zammy plugin');
  const commandName = await prompt('Main command name', name.replace(/^zammy-plugin-/, '').replace(/-/g, ''));

  // Create directory
  const targetDir = resolve(process.cwd(), name);

  if (existsSync(targetDir)) {
    console.log(theme.error(`  ${symbols.cross} Directory already exists: ${name}`));
    return;
  }

  console.log('');
  console.log(theme.dim(`  Creating plugin in ${targetDir}...`));

  try {
    // Create directories
    mkdirSync(targetDir);
    mkdirSync(join(targetDir, 'src'));
    mkdirSync(join(targetDir, 'dist'));

    // Write files
    writeFileSync(join(targetDir, 'zammy-plugin.json'), generateManifest(name, displayName, description, commandName));
    writeFileSync(join(targetDir, 'package.json'), generatePackageJson(name, description));
    writeFileSync(join(targetDir, 'tsconfig.json'), generateTsConfig());
    writeFileSync(join(targetDir, 'src', 'index.ts'), generateEntryPoint(commandName, displayName));
    writeFileSync(join(targetDir, 'README.md'), generateReadme(name, displayName, description, commandName));

    console.log('');
    console.log(`  ${symbols.check} ${theme.success('Plugin created successfully!')}`);
    console.log('');
    console.log(`  ${theme.primary('Next steps:')}`);
    console.log(`    ${theme.dim('1.')} cd ${name}`);
    console.log(`    ${theme.dim('2.')} npm install`);
    console.log(`    ${theme.dim('3.')} npm run build`);
    console.log(`    ${theme.dim('4.')} /plugin install ./${name}`);
    console.log('');
    console.log(`  ${theme.dim('Edit')} ${theme.accent('src/index.ts')} ${theme.dim('to customize your plugin')}`);
    console.log('');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(theme.error(`  ${symbols.cross} Failed to create plugin: ${message}`));
  }
}
