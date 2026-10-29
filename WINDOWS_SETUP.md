# ToolNest v0.8 — Windows disk space and npm troubleshooting

## Read this first

ToolNest is a monorepo. Web, native Expo mobile, and Electron desktop need different dependencies. Installing everything on a nearly full drive can fail; 1.8 GB of free space is not enough for a reliably supported full development environment, particularly Electron and Android tooling.

1. Open PowerShell and run `Get-PSDrive C,D,E | Select Name, @{N='FreeGB';E={[math]::Round($_.Free/1GB,2)}}` to identify a drive with room.
2. Extract the **complete** archive to a *short, writable path*, e.g. `D:\ToolNest`. Confirm `Test-Path D:\ToolNest\package.json` returns `True`.
3. Run `powershell -NoProfile -ExecutionPolicy Bypass -File D:\ToolNest\scripts\diagnose-windows.ps1` **only** to diagnose. This runs the downloaded local script once and does not change permanent execution policy; review its contents first.
4. Use `npm.cmd`, NOT bare `npm`, inside Windows PowerShell. PowerShell may block npm.ps1 (`PSSecurityException`) while `npm.cmd` works.
5. Confirm `Get-PSDrive D` shows sufficient space. If D is full, move the project to E and adjust temporary folders accordingly. An `ENOSPC` error cannot be solved with a Vite flag alone.

## Lightweight WEB install

```powershell
cd D:\ToolNest
New-Item -ItemType Directory -Force D:\DevTools\npm-cache, D:\DevTools\temp
$env:npm_config_cache='D:\DevTools\npm-cache'
$env:TEMP='D:\DevTools\temp'
$env:TMP='D:\DevTools\temp'
New-Item -ItemType Directory -Force .\node_modules # If this fails, fix permissions or disk space before running npm
npm.cmd install --workspace @local-tools/web --workspace @local-tools/core --no-audit --no-fund
npm.cmd run dev
```

`apps/web` now starts Vite with `--configLoader runner` to avoid the specific `node_modules/.vite-temp/vite.config.ts.timestamp-*` write. Other Node/Vite code still needs writable disk space.

**Only if the npm cache contains removable unused data:** `npm.cmd cache clean --force`. Be aware that this means npm must re-download dependencies later. Do not delete existing Visual Studio/SQL Server files indiscriminately.

## Windows desktop install/build

Before this step, free **multiple GB** on the target drive. The desktop tool uses Electron, whose runtime is substantially larger than the web app.

```powershell
cd D:\ToolNest
npm.cmd install --workspace @local-tools/web --workspace @local-tools/core --workspace @local-tools/desktop --no-audit --no-fund
npm.cmd run desktop:run
# Windows installer; build only on a supported Windows environment:
npm.cmd run desktop:win
```

The desktop shell reuses the browser tool engines. Its 5,000 catalog actions are **not** 5,000 independently implemented converters.

## Why `ENOENT ... mkdir node_modules` happened

That error means Node/npm could not create or access a required directory. Common causes include missing/partial extraction, insufficient disk space, permissions or Windows-controlled-folder access. Verify the actual path:

```powershell
Test-Path .\package.json
Test-Path .\apps\web\package.json
New-Item -ItemType Directory -Force .\node_modules
Get-PSDrive D
```

If even `New-Item` fails, npm cannot repair the underlying Windows filesystem problem. Try a shorter writable folder on a drive with adequate capacity. Avoid modifying PowerShell execution policy system-wide just to run npm.

## Android File picker and saving

The mobile app uses Expo SDK 58. The primary document picker requests a cache copy; a separate **Android system picker** is available for provider-specific problems. Generated files are now written into the app's persistent Documents directory before sharing. **Neither route has been verified on your physical Android phone**. A previously installed APK/Expo Go binary may use older native code; rebuild and install the new version to test changes. A real-device test must cover Android version, documents provider, one-page PDF import, rotation, save to Downloads via SAF, and share sheet.

The app does not require `READ_EXTERNAL_STORAGE` to access a document selected through the system file picker on modern Android. Do not add broad storage permissions merely to mask a URI-grant problem.


## Expo Android bundling fails: `Cannot find module './implementation'`

When the Metro terminal reports `node_modules/function-bind/index.js` cannot find `./implementation`, the local npm installation is incomplete. An unrelated warning about failing to deserialize Metro's cache is normally recoverable; fix the missing dependency first.

From the **monorepo root** (e.g. `D:\ToolNest`), stop Expo with Ctrl+C, then use:

```powershell
cd D:\ToolNest
Get-PSDrive D | Select-Object Name, @{N='FreeGB';E={[math]::Round($_.Free/1GB,2)}}
Test-Path .\node_modules\function-bind\implementation.js
npm.cmd run mobile:doctor
# Only if the doctor reports a broken dependency:
npm.cmd run mobile:repair
npm.cmd run start:clean --workspace @local-tools/mobile
```

Before repair, set npm's cache and Windows TEMP/TMP to a drive with room if necessary:

```powershell
New-Item -ItemType Directory -Force D:\DevTools\npm-cache,D:\DevTools\temp | Out-Null
$env:npm_config_cache='D:\DevTools\npm-cache'
$env:TEMP='D:\DevTools\temp'
$env:TMP='D:\DevTools\temp'
```

`mobile:doctor` checks `function-bind` without modifying files. `mobile:repair` removes only a clearly incomplete `function-bind` directory and runs npm's mobile-workspace install, subject to a free-space check. Avoid deleting the complete `node_modules` directory unless targeted recovery fails and there is enough space for a fresh install. An APK already installed on your phone is unaffected by Metro's local dependency errors; you still need to build a new APK for native-app changes.

## Desktop install failures: GitHub timeout, Electron ECONNRESET, Vite missing picomatch

These are three independent errors, not a single source-code compilation issue.

- `gh workflow run ... TLS handshake timeout`: local HTTPS connection to GitHub timed out. A retry on a stable connection or the GitHub Actions web interface is sufficient; this is not a GitHub authentication or Electron source error.
- `node_modules/electron/install.js: read ECONNRESET`: the network connection closed while downloading the large Electron runtime. Electron's official guidance classifies this as a network error. Avoid repeated local installs on low-storage/unstable-network machines. Prefer the previously successful GitHub Actions NSIS installer artifact at https://github.com/Munir-Rahman/local-tools/actions/runs/40879651088 (artifacts expire).
- `Cannot find ... node_modules/picomatch/index.js` while loading Vite: local dependencies are incomplete, probably after interrupted npm installs. `npm install` printing an "added packages" message does not guarantee every installed file is intact.
- `EPERM` during npm cleanup usually means Windows prevented removal of an in-use directory. Close running Vite/Metro/Electron processes and editors before reinstalling; do not disable OS protection.

To diagnose:

```powershell
cd D:\ToolNest
Get-PSDrive D,E | Select-Object Name,@{n='FreeGB';e={[math]::Round($_.Free / 1GB,2)}}
Test-Path .\node_modules\picomatch\index.js
Test-Path .\node_modules\function-bind\implementation.js
```

To fix **multiple broken packages**, once enough storage is available and all project processes are closed, remove **only** `D:\ToolNest\node_modules`. It holds downloaded dependencies, not source code. If Windows reports EPERM, restart Windows and retry. Keep `apps/`, `packages/`, and `package.json` intact.

```powershell
cd D:\ToolNest
New-Item -ItemType Directory -Force D:\DevTools\npm-cache,D:\DevTools\temp | Out-Null
$env:npm_config_cache = 'D:\DevTools\npm-cache'
$env:TEMP = 'D:\DevTools\temp'
$env:TMP = 'D:\DevTools\temp'
Remove-Item -LiteralPath .\node_modules -Recurse -Force
npm.cmd install --workspace @local-tools/web --workspace @local-tools/mobile --workspace @local-tools/core --no-audit --no-fund
node -e "require('function-bind'); require.resolve('picomatch'); console.log('Dependencies resolve')"
npm.cmd run build
```

This intentionally installs web/mobile/core, **not Electron**. For Electron on Windows, use the GitHub-built EXE rather than forcing a large binary download across an unstable connection. For Android cloud builds without Git, see `apps/mobile/README.md` and use `EAS_NO_VCS=1` from `apps/mobile`.

