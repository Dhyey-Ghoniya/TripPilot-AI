const { spawn } = require('node:child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const useShell = process.platform === 'win32';
const children = new Map();
let stopping = false;

for (const script of ['dev:server', 'dev:client']) {
  const child = spawn(npmCommand, ['run', script], {
    stdio: 'inherit',
    shell: useShell,
  });
  children.set(script, child);
  child.on('error', (error) => {
    console.error(`[dev] Could not start ${script}: ${error.message}`);
    stopChildren(1);
  });
  child.on('exit', (code) => {
    if (!stopping && code !== 0) stopChildren(code || 1);
  });
}

function stopChildren(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children.values()) {
    if (!child.killed) child.kill();
  }
  process.exitCode = exitCode;
}

process.on('SIGINT', () => stopChildren(0));
process.on('SIGTERM', () => stopChildren(0));
