# LocalTools

**Offline-first, privacy-first PDF and image utilities** — a React web application with a future React Native app and Tauri desktop app planned in the same repository.

## What works today (web MVP)

- **PDF:** merge, split into individual PDFs (ZIP), extract pages, remove pages, reorder pages, rotate, add ASCII text watermarks, add page numbers, images to PDF, PDF to PNG (ZIP), PDF metadata (JSON).
- **Images:** JPG/PNG/WebP conversion, resize to a given width, JPEG/WebP quality-based re-encoding.
- **Experience:** multi-file drag-and-drop, arrange the file order, validation, processing messages, ZIP outputs, responsive interface, offline PWA cache, installable web-app manifest.

No conversion server is required. File bytes are read and transformed inside the browser with `pdf-lib`, PDF.js, Canvas, and JSZip. No analytics or third-party CDNs are included.

**Important limits:** Office conversions, OCR, password-protected PDFs, cryptographic signatures, advanced PDF size optimization, video/audio conversion, React Native and desktop apps **are not implemented yet**. The UI only offers working or implemented tools, not fake buttons for future tools. Browser memory limits apply. Watermark text currently supports ASCII characters only. Re-encoding an image does not guarantee a smaller file.

## Requirements

- Node.js >=20.19 (22 LTS recommended)
- npm >=10
- Chrome, Firefox, Edge or Safari with modern Canvas support

## Run locally

```bash
# Clone your PRIVATE repository using your own GitHub credentials
git clone https://github.com/Munir-Rahman/local-tools.git
cd local-tools

npm install
npm run dev
# Open the local URL shown in the terminal
```

## Build and preview the offline PWA

```bash
npm run typecheck
npm run build
npm run preview
```

Open the preview over `http://localhost` or HTTPS to permit service workers. Load it once online, allow all assets to install into the browser's storage, then disconnect and reload to test offline processing. The offline cache is browser-managed and may be evicted. A first-time visit cannot work offline. No file bytes are persisted by this app.

To deploy the production build, host `apps/web/dist/` as static files over HTTPS and configure your host to serve `index.html` for client-side paths. No Node.js backend is required for conversions. **Do not put external trackers, analytics, CDNs, or uploads on the site if you intend to keep the privacy promise.**

## Structure

```text
local-tools/
├── apps/
│   └── web/                   # Vite + React + TypeScript + PWA
├── packages/
│   └── core/                  # Shared tool catalog and TypeScript contracts
└── .github/workflows/        # Build/typecheck CI
```

Future modules: `apps/mobile` (React Native), `apps/desktop` (React + Tauri), and additional platform-specific processing engines. Shared catalog and contracts can be reused across all platforms, but React DOM components cannot be pasted unchanged into React Native.

## File safety / privacy

- The selected documents do **not** go to your servers or third-party conversion services.
- Content Security Policy disallows connections to origins other than the site's own origin. This app does not issue conversion network requests.
- Files are held in in-memory JavaScript `File`/`Blob` objects, not in IndexedDB/localStorage.
- Local memory limits: 80 MB per input, 160 MB per batch, up to 32 inputs; split and render are limited to 120 pages per batch. Large or malformed documents can still exceed device memory.
- PDF parser libraries process untrusted files; keep dependencies patched. Do not promise absolute security in a compromised browser or device.
- No remote fonts, trackers, cookies, ad code or cloud AI are bundled.

## Limitations to understand

- PDF-to-PNG performs **rasterization**; text will not remain selectable in PNG.
- Image-to-PDF uses A4 pages and rasterizes JPG, PNG, and WebP images to PNG internally; PDFs with lots of photos may become large.
- Watermarks and page-number stamps are overlays, not cryptographic marks or guaranteed sanitization/redaction.
- PDF page numbering can overlap content on documents with small margins.
- Image transparency is replaced with white when encoding JPEG.
- Converting an image using Canvas may strip image metadata and color-profile information.
- Tools that alter PDFs do not preserve digital signatures.
- Unsupported or encrypted PDFs may fail. No file is changed in place; save the result explicitly.

## Licensing

The repository has not been assigned an application-source license. Review third-party dependency licenses before commercial distribution, especially when adding desktop/mobile native engines.