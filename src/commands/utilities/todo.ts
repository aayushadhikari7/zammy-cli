import { registerCommand } from '../registry.js';
import { theme, symbols, box } from '../../ui/colors.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

interface Todo {
  id: number;
  text: string;
  done: boolean;
  created: string;
}

const TODO_FILE = join(homedir(), '.zammy-todos.json');

function loadTodos(): Todo[] {
  try {
    if (existsSync(TODO_FILE)) {
      return JSON.parse(readFileSync(TODO_FILE, 'utf8'));
    }
  } catch {}
  return [];
}

function saveTodos(todos: Todo[]): void {
  writeFileSync(TODO_FILE, JSON.stringify(todos, null, 2));
}

registerCommand({
  name: 'todo',
  description: 'Manage your todo list',
  usage: '/todo [add|done|remove|clear] [text|id]',
  async execute(args: string[]) {
    const todos = loadTodos();
    const action = args[0]?.toLowerCase();

    if (!action || action === 'list') {
      // List todos
      console.log('');
      console.log(`  ${symbols.clipboard} ${theme.gradient('TODO LIST')} ${symbols.clipboard}`);
      console.log('');

      if (todos.length === 0) {
        console.log(theme.dim('  No todos yet! Add one with /todo add <task>'));
      } else {
        const pending = todos.filter(t => !t.done);
        const completed = todos.filter(t => t.done);

        if (pending.length > 0) {
          console.log(`  ${theme.secondary('Pending:')}`);
          pending.forEach(t => {
            console.log(`    ${theme.dim(`[${t.id}]`)} ${symbols.bullet} ${t.text}`);
          });
        }

        if (completed.length > 0) {
          if (pending.length > 0) console.log('');
          console.log(`  ${theme.secondary('Completed:')}`);
          completed.forEach(t => {
            console.log(`    ${theme.dim(`[${t.id}]`)} ${symbols.check} ${theme.dim(t.text)}`);
          });
        }

        console.log('');
        console.log(theme.dim(`  ${pending.length} pending, ${completed.length} completed`));
      }
      console.log('');
      return;
    }

    if (action === 'add') {
      const text = args.slice(1).join(' ');
      if (!text) {
        console.log(theme.error('Usage: /todo add <task>'));
        return;
      }

      const id = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;
      todos.push({ id, text, done: false, created: new Date().toISOString() });
      saveTodos(todos);

      console.log('');
      console.log(theme.success(`  ${symbols.check} Added: ${text}`));
      console.log('');
      return;
    }

    if (action === 'done') {
      const id = parseInt(args[1]);
      if (isNaN(id)) {
        console.log(theme.error('Usage: /todo done <id>'));
        return;
      }

      const todo = todos.find(t => t.id === id);
      if (!todo) {
        console.log(theme.error(`Todo #${id} not found`));
        return;
      }

      todo.done = true;
      saveTodos(todos);

      console.log('');
      console.log(theme.success(`  ${symbols.check} Completed: ${todo.text}`));
      console.log('');
      return;
    }

    if (action === 'remove' || action === 'rm') {
      const id = parseInt(args[1]);
      if (isNaN(id)) {
        console.log(theme.error('Usage: /todo remove <id>'));
        return;
      }

      const idx = todos.findIndex(t => t.id === id);
      if (idx === -1) {
        console.log(theme.error(`Todo #${id} not found`));
        return;
      }

      const removed = todos.splice(idx, 1)[0];
      saveTodos(todos);

      console.log('');
      console.log(theme.success(`  ${symbols.cross} Removed: ${removed.text}`));
      console.log('');
      return;
    }

    if (action === 'clear') {
      const cleared = args[1] === 'all' ? todos.length : todos.filter(t => t.done).length;

      if (args[1] === 'all') {
        saveTodos([]);
        console.log('');
        console.log(theme.success(`  ${symbols.check} Cleared all ${cleared} todos`));
      } else {
        const remaining = todos.filter(t => !t.done);
        saveTodos(remaining);
        console.log('');
        console.log(theme.success(`  ${symbols.check} Cleared ${cleared} completed todos`));
      }
      console.log('');
      return;
    }

    // Default to add if unknown action
    const text = args.join(' ');
    const id = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;
    todos.push({ id, text, done: false, created: new Date().toISOString() });
    saveTodos(todos);

    console.log('');
    console.log(theme.success(`  ${symbols.check} Added: ${text}`));
    console.log('');
  },
});
