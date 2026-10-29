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
