import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const standaloneRoot = join(root, '.next', 'standalone');
const standaloneNext = join(standaloneRoot, '.next');

if (!existsSync(standaloneRoot)) {
  throw new Error('Expected .next/standalone to exist after next build.');
}

if (!existsSync(standaloneNext)) {
  mkdirSync(standaloneNext, { recursive: true });
}

cpSync(join(root, '.next', 'static'), join(standaloneNext, 'static'), {
  recursive: true,
  force: true,
});

cpSync(join(root, 'public'), join(standaloneRoot, 'public'), {
  recursive: true,
  force: true,
});
