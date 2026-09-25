const { execFileSync } = require('child_process');
const { build } = require('electron-builder');
const path = require('path');

async function packageApp() {
  if (process.platform !== 'darwin') throw new Error('Mily packaging requires macOS.');
  const unsigned = process.argv.includes('--unsigned');
  if (unsigned) {
    process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
    process.env.MILY_UNSIGNED = '1';
  } else {
    for (const key of ['APPLE_ID', 'APPLE_APP_SPECIFIC_PASSWORD', 'APPLE_TEAM_ID']) {
      if (!process.env[key]) throw new Error(`Set ${key} in .env for signed releases, or use npm run build:unsigned.`);
    }
  }
  // Ship one helper that runs on both supported CPU architectures.
  for (const arch of ['arm64', 'x86_64']) {
    execFileSync('swiftc', ['-O', '-target', `${arch}-apple-macosx12.0`,
      '-o', `native/fn-listener-${arch}`, 'native/fn-listener.swift'], { stdio: 'inherit' });
  }
  execFileSync('lipo', ['-create', 'native/fn-listener-arm64', 'native/fn-listener-x86_64',
    '-output', 'native/fn-listener'], { stdio: 'inherit' });
  execFileSync(process.execPath, ['build.js'], { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } });
  const { UPDATE_URL } = require('../config/production.config');
  await build({
    mac: ['dmg', 'zip'], x64: true, arm64: true, publish: 'never',
    config: {
      forceCodeSigning: !unsigned,
      mac: { identity: unsigned ? null : undefined, notarize: false },
      publish: UPDATE_URL ? [{ provider: 'generic', url: UPDATE_URL }] : null,
      afterSign: unsigned ? null : path.join(__dirname, 'notarize.js'),
    },
  });
}
packageApp().catch(error => { console.error(error.message); process.exitCode = 1; });
