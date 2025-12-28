// Re-export registry functions
export { registerCommand, getCommand, getAllCommands, type Command } from './registry.js';

// Auto-register commands
import './help.js';
import './asciiart.js';
import './exit.js';
import './weather.js';
import './joke.js';
import './quote.js';
import './dice.js';
import './flip.js';
import './calc.js';
import './password.js';
import './stats.js';
import './time.js';
import './countdown.js';
import './fortune.js';
