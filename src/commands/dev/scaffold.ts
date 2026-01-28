import { registerCommand } from '../registry.js';
import { theme, symbols } from '../../ui/colors.js';
import {
  getTemplates,
  getTemplate,
  getTemplateNames,
  isValidTemplateName,
  scaffold,
  TemplateName,
} from '../../handlers/dev/scaffold.js';
import boxen from 'boxen';

function showTemplates(): void {
  const templates = getTemplates();

  console.log(boxen(theme.accent(' Project Templates '), { padding: 0, borderStyle: 'round', borderColor: 'cyan' }));
  console.log();

  for (const template of templates) {
    const names = getTemplateNames();
    const key = names.find(n => getTemplate(n)?.name === template.name) || '';
    console.log(`  ${theme.primary(key.padEnd(18))} ${theme.dim(template.description)}`);
    console.log(`    ${theme.dim(`Files: ${template.files.map(f => f.path.split('/').pop()).join(', ')}`)}`);
    console.log();
  }

  console.log(theme.dim('  Usage: /scaffold <template> <project-name>'));
  console.log();
}

function doScaffold(templateName: string, projectName: string, targetDir: string): void {
  if (!isValidTemplateName(templateName)) {
    console.log(theme.error(`Unknown template: ${templateName}`));
    console.log('');
    console.log(theme.dim('Available templates:'));
    for (const name of getTemplateNames()) {
      console.log(`  ${theme.accent(name)}`);
    }
    return;
  }

  const template = getTemplate(templateName as TemplateName);
  console.log(theme.dim(`  Creating ${template?.name} project: ${projectName}...`));
  console.log();

  const result = scaffold(templateName as TemplateName, projectName, targetDir);

  if (result.success) {
    console.log(`${symbols.check} ${theme.success('Project created!')}`);
    console.log();
    console.log(`  ${theme.primary('Location:')} ${targetDir}/${projectName}`);
    console.log();
    console.log(theme.dim('  Files created:'));
    for (const file of result.files || []) {
      console.log(`    ${theme.accent(file)}`);
    }
    console.log();
    console.log(theme.secondary('  Next steps:'));
    console.log(`    ${theme.dim('cd')} ${projectName}`);
    console.log(`    ${theme.dim('npm install')}`);
    if (templateName === 'express-api') {
      console.log(`    ${theme.dim('cp .env.example .env')}`);
    }
    console.log(`    ${theme.dim('npm run dev')}`);
    console.log();
  } else {
    console.log(theme.error(`Failed to create project: ${result.error}`));
  }
}

function showHelp(): void {
  console.log('');
  console.log(theme.secondary('Usage:'));
  console.log(`  ${theme.primary('/scaffold')}                       ${theme.dim('List available templates')}`);
  console.log(`  ${theme.primary('/scaffold <template> <name>')}     ${theme.dim('Create project from template')}`);
  console.log(`  ${theme.primary('/scaffold <template> <name> <dir>')} ${theme.dim('Create in specific directory')}`);
  console.log('');
  console.log(theme.secondary('Templates:'));
  for (const name of getTemplateNames()) {
    const template = getTemplate(name);
    console.log(`  ${theme.accent(name.padEnd(18))} ${theme.dim(template?.description || '')}`);
  }
  console.log('');
  console.log(theme.secondary('Examples:'));
  console.log(`  ${theme.dim('/scaffold node-cli my-tool')}`);
  console.log(`  ${theme.dim('/scaffold ts-lib my-library')}`);
  console.log(`  ${theme.dim('/scaffold express-api my-api ./projects')}`);
  console.log('');
}

registerCommand({
  name: 'scaffold',
  description: 'Create a new project from template',
  usage: '/scaffold <template> <name> [dir]',
  execute: async (args) => {
    const first = args[0]?.toLowerCase();

    if (!first || first === 'list') {
      showTemplates();
      return;
    }

    if (first === 'help' || first === '--help' || first === '-h') {
      showHelp();
      return;
    }

    const templateName = first;
    const projectName = args[1];
    const targetDir = args[2] || process.cwd();

    if (!projectName) {
      console.log(theme.error('Please provide a project name'));
      console.log(theme.dim(`  Usage: /scaffold ${templateName} <project-name>`));
      return;
    }

    doScaffold(templateName, projectName, targetDir);
  },
});
