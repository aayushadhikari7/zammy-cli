/**
 * Handlers Module
 *
 * This module contains pure business logic separated from CLI concerns.
 * Handlers are reusable, testable functions that can be used independently
 * of the command-line interface.
 *
 * Structure:
 * - dev/      - Developer tools (hash, uuid, encode)
 * - utilities/ - Utility functions (calc, password, stats)
 * - fun/      - Fun features (dice, flip, fortune)
 * - creative/ - Creative tools (lorem, color)
 */

export * from './dev/index.js';
export * from './utilities/index.js';
export * from './fun/index.js';
export * from './creative/index.js';
