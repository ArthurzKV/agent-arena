#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const webMode = args.includes('--web');

// Check for API key
if (!process.env.ANTHROPIC_API_KEY) {
  const envPath = join(process.cwd(), '.env');
  const pkgEnvPath = join(__dirname, '..', '.env');

  for (const p of [envPath, pkgEnvPath]) {
    if (existsSync(p)) {
      const content = readFileSync(p, 'utf-8');
      const match = content.match(/ANTHROPIC_API_KEY=(.+)/);
      if (match) {
        process.env.ANTHROPIC_API_KEY = match[1].trim();
        break;
      }
    }
  }
}

const { register } = await import('tsx/esm/api');
register();

if (webMode) {
  // Web mode: start server + open browser
  await import(join(__dirname, '..', 'server', 'index.ts'));
  const { default: open } = await import('open');
  const port = process.env.PORT || 4242;
  setTimeout(() => open(`http://localhost:${port}`), 1000);
} else {
  // TUI mode: interactive terminal app (default)
  // With args: jumps straight to fight. Without: shows home screen.
  await import(join(__dirname, '..', 'cli', 'index.tsx'));
}
