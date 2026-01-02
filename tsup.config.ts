import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'plugins': 'src/plugins/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  // Shebang will be in all files but harmless for imported modules
  banner: {
    js: '#!/usr/bin/env node',
  },
});
