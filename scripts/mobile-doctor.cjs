#!/usr/bin/env node
'use strict';

// Run from the ToolNest repository root:
//   node scripts/mobile-doctor.cjs           (read-only diagnosis)
//   node scripts/mobile-doctor.cjs --repair  (repair incomplete mobile npm dependency)
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const mobile = path.join(root, 'apps', 'mobile');
const repair = process.argv.includes('--repair');
const log = (msg) => console.log('[ToolNest mobile] ' + msg);
const error = (msg) => { console.error('[ToolNest mobile] ERROR: ' + msg); process.exitCode = 1; };

function verify() {
  try {
    const entry = require.resolve('function-bind', { paths: [mobile, root] });
    const implementation = path.join(path.dirname(entry), 'implementation.js');
    if (!fs.existsSync(implementation)) throw new Error('Missing ' + implementation);
    require(entry); // Babel needs the module to execute, not just resolve.
    log('OK: function-bind loads from ' + entry);
    return true;
  } catch (e) {
    log('Broken npm dependency: ' + e.message);
    return false;
  }
}

if (!fs.existsSync(path.join(root, 'package.json')) ||
    !fs.existsSync(path.join(mobile, 'package.json'))) {
  error('Cannot find the complete ToolNest monorepo. Expected ' + root);
} else if (verify()) {
  log('Next: npm.cmd run start:clean --workspace @local-tools/mobile');
} else if (!repair) {
  error('Run: node scripts/mobile-doctor.cjs --repair');
} else {
  try {
    const stats = fs.statfsSync(root);
    const freeBytes = Number(stats.bavail) * Number(stats.bsize);
    log('Project drive free: ' + (freeBytes / 1073741824).toFixed(2) + ' GiB');
    if (freeBytes < 536870912) {
      error('Not enough free space to safely repair. Free space on the project drive first.');
      process.exit(1);
    }
  } catch (e) {
    if (process.exitCode) process.exit(1);
    log('Unable to measure free space; please check the drive before continuing.');
  }

  // Only delete the incomplete function-bind package; never delete all node_modules.
  for (const dir of [
    path.join(root, 'node_modules', 'function-bind'),
    path.join(mobile, 'node_modules', 'function-bind'),
  ]) {
    if (fs.existsSync(path.join(dir, 'index.js')) &&
        !fs.existsSync(path.join(dir, 'implementation.js'))) {
      log('Removing incomplete package folder: ' + dir);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  log('Reinstalling the mobile workspaces using npm...');
  const args = [
    'install', '--workspace', '@local-tools/mobile',
    '--workspace', '@local-tools/core', '--include-workspace-root',
    '--no-audit', '--no-fund', '--prefer-online',
  ];
  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(cmd, args, {
    cwd: root, stdio: 'inherit', shell: process.platform === 'win32',
  });
  if (result.error || result.status !== 0) {
    error('npm install failed. Check disk space, network and npm logs. ' +
      (result.error ? result.error.message : 'Exit code ' + result.status));
  } else if (verify()) {
    log('Repair successful. Clear Metro cache and restart:');
    log('npm.cmd run start:clean --workspace @local-tools/mobile');
  } else {
    error('Dependency still broken. A clean reinstall may be necessary once enough disk space is available.');
  }
}
