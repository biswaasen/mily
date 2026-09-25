const { spawn } = require('child_process');

const watcher = spawn(process.execPath, ['build.js', '--watch'], { stdio: 'inherit' });
const electron = spawn(require('electron'), ['.'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' },
});
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  watcher.kill();
  electron.kill();
  process.exitCode = code;
}
for (const child of [watcher, electron]) {
  child.on('error', error => { console.error(error); stop(1); });
  child.on('exit', code => stop(code ?? 0));
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
