# Fix missing Vite on Windows and npm TAR_ENTRY_ERROR

These are two symptoms of an incomplete Node dependency installation:

- `TAR_ENTRY_ERROR UNKNOWN` / `ENOENT` when npm writes into `node_modules`: storage writes/extractions are failing. Possible causes include insufficient disk space, antivirus, interrupted installs, other npm processes, permissions, or drive problems. The exact cause cannot be inferred from warnings alone.
- `'vite' is not recognized`: the web workspace's devDependency did not get installed or its executable is missing. Vite is installed locally; do **not** install Vite globally or disable PowerShell protections.

## Fast repair

1. Stop **all** Expo, Vite, Electron and npm installations before repairing shared `node_modules`. Use Ctrl+C in each terminal, close the desktop development process, and verify several GB are free on D:.
2. From the source root `D:\ToolNest-latest`, run:

```powershell
cd D:\ToolNest-latest
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\repair-web-install.ps1
npm.cmd run dev
```

3. If repair fails because an earlier installation left broken modules, close all Node processes and rerun with **-Reset**, which deletes only the repository's `node_modules` folders; it does not delete code, documents, ZIPs or Git history:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\repair-web-install.ps1 -Reset
npm.cmd run dev
```

4. If `Remove-Item` fails with access denied, identify locking processes and drive permissions; do **not** blindly disable Defender or delete your project files. If the drive continues to return `UNKNOWN` I/O errors, examine filesystem health using Windows Event Viewer and `chkdsk D: /scan` after securing your work.

This script installs **only web and core workspaces** to avoid unnecessary mobile/Electron downloads while repairing Vite. The separate mobile/desktop installers can be used afterward.

## Tools capability statement

The 5,000-action roadmap is not 5,000 implemented processors. The web frontend also offers 1,500+ working dimensional conversion routes, which use explicit factors for 12 unit families. These are working mathematical conversions, **not 1,500 different PDF/Office codecs**. Other PDF, media, Office, image, and archive operations have separate support and limitations. Android has its own smaller native processing library; features must be validated on real Android devices before releasing.
