# Fixing ToolNest's Android EAS build (SDK 58)

## Verified cause of build 93ba1522-d6c5-4bd6-8899-4898759c0be5

EAS was invoked using `EAS_NO_VCS=1` inside `apps/mobile`. With that option, EAS uploaded only that directory. The old `src/masterCatalog.ts` imported `../../../packages/catalog/chunk-00.json` and 19 more JSON chunks **outside** the upload. Metro stopped on `Unable to resolve .../packages/catalog/chunk-00.json`.

The project now contains `apps/mobile/src/catalog/chunk-00.json` through `chunk-19.json`, and the imports reference `./catalog/`. This preserves the searchable 5,000-entry **roadmap**; it does not create 5,000 functional processing engines.

Expo Doctor also reported:
- Unsupported `android.edgeToEdgeEnabled` field: removed.
- Missing `expo-font` required by vector icons: added a compatible SDK 58 version.
- TypeScript and safe-area version mismatches: versions aligned with the errors reported.
- `cli.appVersionSource` missing: configured to `remote` in `eas.json`.

The no-lockfile warning is not the fatal Metro error. An npm lockfile for a stable standalone distribution would improve reproducibility.

## Rebuild from the UPDATED source (without installing Git)

Download a fresh ZIP from the GitHub `main` branch and fully extract it into `D:\ToolNest`. An older ZIP does **not** receive GitHub changes automatically. Keep all of `apps/mobile/src/catalog/`.

```powershell
cd D:\ToolNest
Test-Path .\apps\mobile\src\catalog\chunk-00.json
# Above must show True.
npm.cmd install --workspace @local-tools/mobile --workspace @local-tools/core --no-audit --no-fund
npm.cmd run test:full-catalog --workspace @local-tools/mobile
npm.cmd run typecheck --workspace @local-tools/mobile

cd D:\ToolNest\apps\mobile
$env:EAS_NO_VCS = '1'
$env:npm_config_cache = 'D:\DevTools\npm-cache'
npx.cmd --yes eas-cli@latest build --platform android --profile preview --clear-cache
```

This needs internet to upload the archive and generate an APK on Expo servers. The `preview` profile requests an Android APK. EAS signing stays associated with the same existing Expo project.

## Desktop theme

Electron launches the built web frontend from `apps/web/dist`. The current web v0.9 appearance becomes the desktop appearance **after a new installer build**. The Electron window background is also changed to match the light web theme. An earlier installer will still show the earlier UI.

## Validation boundaries

GitHub Mobile CI validates source integrity, 5,000 bundled catalog records, TypeScript, and Android JavaScript export. It is **not** a signed native APK build. Physical-device QA remains necessary for SAF file selection, saving, sharing, fonts, PDF/image processing, and real offline usage. Any new EAS failure after this fix needs the first red build step/log, not the previous `chunk-00.json` stack trace.
