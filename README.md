# LocalTools

**Local-first, no-file-upload document and utility suite** — React + TypeScript + Vite PWA; one monorepo for future React Native and Tauri apps.

## Web v0.2 capabilities

- **Dashboard:** dark / light / system theme, accent color, favorites, tool search, local recent activity, tool history, responsive navigation.
- **Local persistence:** SQLite WASM (`sql.js`) exported to **IndexedDB**. Saves favorites, activity metadata (tool, input/output filenames, timestamp), preferences and saved CV/invoice drafts. **No input document data or converted file bytes are stored in the database**. Browser storage can be cleared or evicted; there is no cloud sync or account.
- **PDF (11):** merge, split into individual PDFs (ZIP), extract, remove, reorder, rotate, watermark ASCII text, number pages, images to PDF, PDF to PNG (ZIP), inspect PDF metadata (JSON).
- **Images (3):** convert JPG/PNG/WebP, resize images, re-encode for compression.
- **Other utilities (8):** QR code generator (text, URL, Wi-Fi, vCard), Code 128 barcode, JSON validator/formatter/minifier, word count, case converter, Base64 text encode/decode, UUID v4 generator, SHA-256 text digest.
- **Templates (2):** CV/resume builder (Modern, Classic, Minimal; editable personal sections, accent color, browser Print/Save to PDF); invoice generator with editable company, invoice and items, print to PDF. Local SQLite draft saving.
- **480-action catalog:** search and browse all 480 proposed actions across 24 categories. Action-to-feature mappings are approximate where one implementation covers multiple related actions. Planned actions are **not implemented** and do not run.

**Important:** 24 working tool interfaces/builders, not 480 working converters. A successful CI build means the project compiles, not that every tool has undergone exhaustive real-file testing. Browser print output can vary. The CV form supports basic structured sections, not a WYSIWYG editor. Invoice currently has one line item. Recent activity metadata never contains downloadable copies of processed documents.

## Privacy and offline constraints

All conversions happen locally in the browser: documents are not uploaded to a server. The web app needs a network connection to download its code the first time; after offline assets are cached, most tools can run without network access. Cache may be evicted by the browser. No cloud conversion server, analytics or third-party CDN is used. The included content-security policy disallows external connections. The initial app's PDF size, page count and browser RAM limits still apply.

No absolute privacy or security guarantee is possible on a compromised device. Do not use the PDF watermark as secure redaction or assume PDF signatures are preserved after editing.

## Prerequisites

Node.js >=20.19 and npm >=10. For a machine short on C: space, use a portable Node.js distribution on D: and configure the npm cache on D: before installing.

## Develop

```powershell
cd D:\Github\local-tools-main
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

Open the local URL printed by Vite (usually http://localhost:5173). To build:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run preview
```

The compiled application is in `apps/web/dist` and can be served statically over HTTPS. GitHub Actions runs type checking and a production build on each push to `main`.

To update a ZIP-downloaded copy without Git, download the new repository ZIP and replace source files (not `node_modules`), then re-run `npm.cmd install` if dependencies changed.

## Source layout

```text
apps/web/src/App.tsx           Dashboard, favorites, recent activity, catalog, settings
apps/web/src/dashboard.css     Dashboard styling and themes
apps/web/src/PdfWorkspace.tsx  Embedded PDF/image tool workspace
apps/web/src/conversion.ts    PDF/image engine
apps/web/src/Utilities.tsx     Text, JSON, QR, barcode and developer utilities
apps/web/src/Templates.tsx     CV and invoice builders
apps/web/src/localDb.ts       SQLite WASM + IndexedDB persistence
apps/web/src/catalog.ts       All 480 user-supplied roadmap actions
packages/core/src/index.ts    Original shared PDF/image tool definitions
```

## Not implemented yet

DOCX/XLSX/PPTX full-fidelity conversion, AI/OCR, advanced PDF compression, signing/encryption, video/audio codecs, WYSIWYG CV editing, many business templates, mobile/desktop apps, cloud login/sync, file history re-download, automated real-file test suite. These require separate investigation and testing.

## Licenses

Check the licenses and distribution obligations of all dependencies before publishing the app or bundling native engines. The project's private repository does not yet include a separately selected application license.