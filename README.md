# LocalTools v0.5 — Web and Native Mobile

**Projects:** `apps/web` (React/Vite PWA), `apps/mobile` (Expo SDK 58 / React Native 0.88). A future desktop application can reuse browser UI but needs native conversion engines. The app is local-first and deliberately makes no file-content upload API.

## Mobile (new)

See [apps/mobile/README.md](apps/mobile/README.md) for offline mobile PDF/image tools, native SQLite, favorites, recent activity, QR, and CV/invoice generators. The 480-entry roadmap is searchable but not all actions run natively. React Native cannot directly reuse the browser's FFmpeg WebAssembly worker; mobile media transcoding requires a separate native engine. No signed APK/iOS binary has been produced.

## Web FFmpeg startup fix

For Vite, the FFmpeg core is now copied from `@ffmpeg/core/dist/esm`. Before launching, the web tool verifies its own FFmpeg asset and reports a 90-second startup timeout instead of spinning indefinitely. Run `npm install` followed by `npm run dev` to recopy FFmpeg, then verify the `ffmpeg-core.js` and `.wasm` URLs load from localhost. A browser smoke test runs WAV → MP3 in CI.

---

# LocalTools — Offline-First Web Utilities (v0.4 browser preview)

This repository contains a React + TypeScript + Vite PWA for client-side file processing, with a SQLite WebAssembly database saved in browser IndexedDB for optional local preferences, favorites, activity metadata and template drafts.

## Scope and honesty

The catalog contains **all 480 numbered ideas** from the supplied product backlog, grouped into 24 categories. **A catalog entry is not proof that its converter is implemented.** The web UI labels unsupported entries as *Planned*. Office conversions in this release are intentionally simplified; accurate Office layout conversion, AI inference, OCR, professional-grade media transcoding and signed-PDF validation remain future work. A purely offline implementation is not feasible for live exchange-rate services and remotely editable QR redirects.

In addition to the previous 14 PDF/image utilities, eight basic developer/QR/text tools and two document generators, this preview adds 90 text/developer/design/calculator actions, new browser image editing operations, several PDF page/form actions, ZIP/file operations and CSV operations. Each additional action has its own UI and real local implementation, but **a build passing does not establish conversion correctness for all possible files**. Carefully review the limitations below before using real documents.

## Setup

Node.js 22 recommended. Run at the repository root:

```sh
npm install
npm run typecheck
npm run build
npm run dev
```

Open Vite's reported local URL. No cloud conversion backend is required. To run the production PWA offline, serve the generated `apps/web/dist` folder from localhost or HTTPS, allow the service worker to install its assets, then turn networking off for an offline test. Browser cache eviction can remove assets.

## Storage and privacy

- Browser SQLite through sql.js and IndexedDB for **metadata and template drafts only**. It is not a desktop OS SQLite service.
- The current application does not upload documents, but browsers/extensions, hosting, and installed scripts must still be audited before claiming absolute privacy.
- Loading the web app initially requires access to the static assets; no remote AI or cloud conversion servers are bundled.
- Large/decompression-heavy files can exhaust browser memory. File and pixel caps reduce but do not eliminate this risk.
- ZIP extraction is limited and does not preserve folder paths, to avoid path traversal.
- PDF page cropping is **not redaction** and changing common PDF metadata is **not forensic sanitization**.
- PDF editing destroys or invalidates existing cryptographic signatures. Existing text content is not safely redacted.
- CSV SQL generation creates SQL Server-flavored statements; always review output before executing it.
- Token decoding is not verification; HS256 verification does not automatically validate claims or expiry.
- Text encryption uses AES-GCM with a PBKDF2-derived key, requiring correct password and supported browser Web Crypto.
- PNG/JPEG conversion may discard EXIF and color profile metadata. Many operations are intentionally limited to JPG/PNG/WebP.
- These utilities should not be treated as independently security-audited or legally compliant services.

## Local filesystem structure

- `apps/web/src/catalog.ts`: all 480 catalog ideas and availability aliases
- `apps/web/src/extraEngine.ts`: 90 locally executed text, design, developer and calculator actions
- `apps/web/src/ExtraWorkbench.tsx`: form-driven interface for the above actions
- `apps/web/src/ImageWorkbench.tsx`: image Canvas operations
- `apps/web/src/PdfAdvanced.tsx`: additional PDF manipulation and extraction
- `apps/web/src/FileWorkbench.tsx`: ZIP, GZIP, hash, file metadata utilities
- `apps/web/src/CsvWorkbench.tsx`: CSV filters, sort, dedup-related tasks
- `apps/web/src/App.tsx`: theme-aware dashboard and routing
- `apps/web/src/localDb.ts`: sql.js + IndexedDB storage adapter
- `apps/web/tests/extraEngine.test.mjs`: core engine regression checks

## Testing

```sh
node --experimental-strip-types --test apps/web/tests/extraEngine.test.mjs
```

This tests representative text, crypto, developer, design and calculation operations. Additional real-file browser integration and security tests remain necessary.

## Roadmap

Keep unsupported features marked Planned. Prioritize automated tests, accessible UI controls, safe file size limits, cancellation, real-browser testing and platform-specific mobile/desktop engines before expanding claims.

## v0.4 changes (29 October 2026)

- Fixed browser Content Security Policy to permit **local WebAssembly compilation** (`wasm-unsafe-eval`), required by SQLite and FFmpeg. WebAssembly runs locally and no third-party JS script source is enabled.
- Light theme on new installs; improved default text sizes and contrast, with dark and system mode options preserved.
- Browser SQLite and IndexedDB persistence self-test and downloadable `.sqlite` backup in Settings. Favorites and activity still persist locally when browser storage is permitted.
- 34 domain calculators: binary/octal/hex/base conversion, SI and IEC storage, electrical, physics, chemistry, engineering cost/material formulas. Units and assumptions displayed.
- 10 extra printable business document templates, including certificates, receipts, quotations, purchase orders, employee IDs, business cards, labels and timesheets. Form editing, A4 print and local drafts.
- 8 **basic** Office conversion workflows including DOCX/PPTX/XLSX to text-only PDF, PDF text extraction to DOCX/XLSX, page-image PDF to PPTX, and CSV/XLSX exchange. This does NOT retain complex Office styles, tables, formulas or layout.
- 20 browser media actions via self-hosted FFmpeg WebAssembly. Includes MP4/WebM transcoding, extracted MP3 from video, audio format conversion and an image/audio-to-MP4 builder. **32 MB+ core and substantial runtime memory** required. Some codec operations can fail depending on the supported build.
- Additional GitHub Actions checks for real-browser SQLite persistence and favorites (Playwright).

## Media-specific setup

Run `npm install` at the repository root, then `npm run dev` or `npm run build`. A `predev`/`prebuild` script copies the local FFmpeg core JS/WASM into `apps/web/public/ffmpeg` from the installed npm package. No CDN or third-party upload service is used. These large assets are generated locally and are **not committed to source control**. They are included in the built PWA and may take more than 30 MB of disk/network on first visit.

## Important limitations

This is an experimental, expanding project, **not 480 production-ready converters**. The 480-row catalog remains complete and each action's actual availability is separately tracked. The browser cannot perform a remotely editable QR redirect entirely offline, cannot guarantee full-fidelity Office conversions, and cannot run every professional codec or AI workload in constrained devices. Simplified Office conversion workflows are explicitly titled and described as such. Do not use the formulas as a substitute for independent engineering checks. Browser ZIP-based processing can be resource intensive; stay within published file limits.
