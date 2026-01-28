import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface TemplateFile {
  path: string;
  content: string;
}

export interface Template {
  name: string;
  description: string;
  files: TemplateFile[];
}

export type TemplateName = 'node-cli' | 'ts-lib' | 'express-api' | 'react-component';

const TEMPLATES: Record<TemplateName, Template> = {
  'node-cli': {
    name: 'Node.js CLI',
    description: 'A Node.js command-line application with argument parsing',
    files: [
      {
        path: 'package.json',
        content: `{
  "name": "{{name}}",
  "version": "1.0.0",
  "description": "A CLI application",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "{{name}}": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc -w",
    "start": "node dist/index.js"
  },
  "keywords": ["cli"],
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}`,
      },
      {
        path: 'tsconfig.json',
        content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}`,
      },
      {
        path: 'src/index.ts',
        content: `#!/usr/bin/env node

const args = process.argv.slice(2);

function main() {
  console.log('Hello from {{name}}!');

  if (args.length > 0) {
    console.log('Arguments:', args.join(', '));
  }
}

main();
`,
      },
      {
        path: '.gitignore',
        content: `node_modules/
dist/
*.log
.DS_Store
`,
      },
      {
        path: 'README.md',
        content: `# {{name}}

A CLI application.

## Install

\`\`\`bash
npm install -g {{name}}
\`\`\`

## Usage

\`\`\`bash
{{name}} [args]
\`\`\`
`,
      },
    ],
  },
  'ts-lib': {
    name: 'TypeScript Library',
    description: 'A TypeScript library with testing setup',
    files: [
      {
        path: 'package.json',
        content: `{
  "name": "{{name}}",
  "version": "1.0.0",
  "description": "A TypeScript library",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc -w",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "keywords": [],
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}`,
      },
      {
        path: 'tsconfig.json',
        content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts"]
}`,
      },
      {
        path: 'src/index.ts',
        content: `export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

export function add(a: number, b: number): number {
  return a + b;
}
`,
      },
      {
        path: 'src/index.test.ts',
        content: `import { describe, it, expect } from 'vitest';
import { greet, add } from './index.js';

describe('{{name}}', () => {
  it('greets by name', () => {
    expect(greet('World')).toBe('Hello, World!');
  });

  it('adds numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});
`,
      },
      {
        path: '.gitignore',
        content: `node_modules/
dist/
*.log
.DS_Store
coverage/
`,
      },
      {
        path: 'README.md',
        content: `# {{name}}

A TypeScript library.

## Install

\`\`\`bash
npm install {{name}}
\`\`\`

## Usage

\`\`\`typescript
import { greet } from '{{name}}';

console.log(greet('World'));
\`\`\`
`,
      },
    ],
  },
  'express-api': {
    name: 'Express API',
    description: 'An Express.js REST API with TypeScript',
    files: [
      {
        path: 'package.json',
        content: `{
  "name": "{{name}}",
  "version": "1.0.0",
  "description": "An Express REST API",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js"
  },
  "keywords": ["api", "express"],
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}`,
      },
      {
        path: 'tsconfig.json',
        content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}`,
      },
      {
        path: 'src/index.ts',
        content: `import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to {{name}} API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});
`,
      },
      {
        path: '.gitignore',
        content: `node_modules/
dist/
*.log
.DS_Store
.env
`,
      },
      {
        path: '.env.example',
        content: `PORT=3000
`,
      },
      {
        path: 'README.md',
        content: `# {{name}}

An Express REST API.

## Setup

\`\`\`bash
npm install
cp .env.example .env
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Endpoints

- \`GET /\` - Welcome message
- \`GET /health\` - Health check
`,
      },
    ],
  },
  'react-component': {
    name: 'React Component',
    description: 'A React component library with Storybook',
    files: [
      {
        path: 'package.json',
        content: `{
  "name": "{{name}}",
  "version": "1.0.0",
  "description": "A React component library",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc -w"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  }
}`,
      },
      {
        path: 'tsconfig.json',
        content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"]
}`,
      },
      {
        path: 'src/index.ts',
        content: `export { Button } from './Button.js';
export type { ButtonProps } from './Button.js';
`,
      },
      {
        path: 'src/Button.tsx',
        content: `import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export function Button({ children, variant = 'primary', onClick }: ButtonProps) {
  const styles: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: variant === 'primary' ? '#007bff' : '#6c757d',
    color: 'white',
  };

  return (
    <button style={styles} onClick={onClick}>
      {children}
    </button>
  );
}
`,
      },
      {
        path: '.gitignore',
        content: `node_modules/
dist/
*.log
.DS_Store
`,
      },
      {
        path: 'README.md',
        content: `# {{name}}

A React component library.

## Install

\`\`\`bash
npm install {{name}}
\`\`\`

## Usage

\`\`\`tsx
import { Button } from '{{name}}';

function App() {
  return <Button variant="primary">Click me</Button>;
}
\`\`\`
`,
      },
    ],
  },
};

export function getTemplates(): Template[] {
  return Object.values(TEMPLATES);
}

export function getTemplate(name: TemplateName): Template | undefined {
  return TEMPLATES[name];
}

export function getTemplateNames(): TemplateName[] {
  return Object.keys(TEMPLATES) as TemplateName[];
}

export function isValidTemplateName(name: string): name is TemplateName {
  return name in TEMPLATES;
}

export function scaffold(
  templateName: TemplateName,
  projectName: string,
  targetDir: string
): { success: boolean; error?: string; files?: string[] } {
  const template = TEMPLATES[templateName];
  if (!template) {
    return { success: false, error: `Unknown template: ${templateName}` };
  }

  // Validate project name
  if (!/^[a-z][a-z0-9-]*$/.test(projectName)) {
    return {
      success: false,
      error: 'Project name must start with a letter and contain only lowercase letters, numbers, and hyphens',
    };
  }

  const projectDir = join(targetDir, projectName);

  // Check if directory exists
  if (existsSync(projectDir)) {
    return { success: false, error: `Directory already exists: ${projectDir}` };
  }

  try {
    // Create project directory
    mkdirSync(projectDir, { recursive: true });

    const createdFiles: string[] = [];

    // Create files
    for (const file of template.files) {
      const filePath = join(projectDir, file.path);
      const fileDir = join(projectDir, file.path.split('/').slice(0, -1).join('/'));

      // Create parent directories if needed
      if (fileDir !== projectDir && !existsSync(fileDir)) {
        mkdirSync(fileDir, { recursive: true });
      }

      // Replace placeholders
      const content = file.content.replace(/\{\{name\}\}/g, projectName);

      writeFileSync(filePath, content);
      createdFiles.push(file.path);
    }

    return { success: true, files: createdFiles };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create project',
    };
  }
}
