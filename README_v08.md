# ToolNest 0.8 development update

**Status:** Source update. Not a fully tested commercial release. The 5,000-action master catalog is searchable across web/mobile/desktop-shared UI; it is *not* a count of implemented processors.

- **Web:** Vite config loader uses `runner` to avoid a temporary config write. This does not eliminate the need for free disk space. A local personal-name page was added to footer navigation using browser SQLite preferences.
- **Mobile:** 53 runnable tool tiles (previously 23), including 30 new pure-JS text/data/calculator tools. All 5,000 ideas remain visible in the separate catalog with `PLANNED` for tools without engines. Two picker paths (Expo DocumentPicker and Expo File.pickFileAsync) and persistent app output storage are included, but Android permission/sharing fixes **are unverified on real devices**.
- **Desktop:** Electron shell still uses bundled React web app. It reuses the web's tool interfaces and catalog. No native AdSense or advertising SDK is present in the desktop shell. Windows package/build requires Electron dependencies and adequate disk space.
- **Source validation:** Pure text-engine tests and local-server test run using Node; TypeScript AST parsing checks syntax. Full Expo/React builds require installed npm workspaces and CI.

## Start on Windows

Read [WINDOWS_SETUP.md](WINDOWS_SETUP.md). Prefer `npm.cmd` instead of `npm` in PowerShell. Free drive space before installing and avoid the nested, exceptionally long extraction path. New scripts under `scripts/` provide one-click `.cmd` helpers for WEB-only dependency installation and launching.

## Privacy and advertisements

Document processing executes locally for implemented tools. Ads are *not live* in this source, and the remote ad network would require internet and consent. Google AdSense scaffolding is for the website on approved origins only; the standalone Electron desktop window excludes AdSense. Mobile AdMob is a placeholder, not a working ad SDK integration.
