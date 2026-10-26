import { build } from '/opt/npm-tools/node_modules/esbuild/lib/main.js';
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const out = resolve(root, 'tests/out');
mkdirSync(out, { recursive: true });

await build({
  entryPoints: [resolve(root, 'tests/harness/main.tsx')],
  bundle: true,
  outfile: resolve(out, 'app.js'),
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  nodePaths: ['/opt/npm-tools/node_modules'],
  alias: { 'next/link': resolve(root, 'tests/harness/link.tsx') },
  tsconfig: resolve(root, 'tsconfig.json'),
  logLevel: 'warning',
});

cpSync(resolve(root, 'src/app/globals.css'), resolve(out, 'globals.css'));
writeFileSync(
  resolve(out, 'index.html'),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>harness</title><link rel="stylesheet" href="/globals.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>`,
);
console.log('built');
