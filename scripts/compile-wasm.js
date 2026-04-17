import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { spawn } from 'child_process';
import { intro, outro, select, spinner, cancel } from '@clack/prompts';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesDir = join(__dirname, '../src/pages');

const projects = readdirSync(pagesDir).filter((page) =>
  existsSync(join(pagesDir, page, 'compile-wasm.sh')),
);

if (projects.length === 0) {
  console.error('No compile-wasm.sh scripts found under src/pages/');
  process.exit(1);
}

intro('WASM Compiler');

const project = await select({
  message: 'Select a project to compile',
  options: projects.map((name) => ({ value: name, label: name })),
});

if (typeof project !== 'string') {
  cancel('Cancelled.');
  process.exit(0);
}

const s = spinner();
s.start(`Compiling ${project}`);

const projectDir = join(pagesDir, project);

await new Promise((resolve, reject) => {
  const proc = spawn('bash', ['compile-wasm.sh'], {
    cwd: projectDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  proc.stdout.on('data', (data) => process.stdout.write(data));
  proc.stderr.on('data', (data) => process.stderr.write(data));

  proc.on('close', (code) => {
    if (code === 0) {
      resolve();
    } else {
      reject(new Error(`Exited with code ${code}`));
    }
  });
});

s.stop(`Done`);
outro(`${project} compiled successfully`);
