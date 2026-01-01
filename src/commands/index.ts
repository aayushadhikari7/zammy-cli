// Re-export registry functions
export { registerCommand, getCommand, getAllCommands, type Command } from './registry.js';

// Auto-register commands by category
import './utilities/index.js';
import './fun/index.js';
import './creative/index.js';
import './dev/index.js';
import './info/index.js';
import './plugin/index.js';
