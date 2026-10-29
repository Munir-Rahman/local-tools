# LocalTools Mobile — Android / iOS

A native React Native / Expo mobile companion to the private LocalTools web application. Built using **Expo SDK 58, React Native 0.88, TypeScript, native SQLite**, local device file processing and native share sheets.

## Implemented native tools

- **PDF:** merge, split into ZIP of per-page PDFs, extract page ranges, rotate, add page numbering, ASCII watermark, images to PDF, inspect metadata.
- **Images:** resize, rotate, flip, JPEG compression, convert to JPEG or PNG via native `expo-image-manipulator`.
- **Developer/text:** JSON formatter, word/character/line counter, uppercase, whitespace cleanup, URL encoding and cryptographically secure UUIDv4.
- **QR:** generate static QR and export SVG without a server.
- **Documents:** configurable resume/CV (three visual styles) and editable invoice PDF, created using native print-to-PDF.
- **SQLite:** persistent favorites, recent successful actions, light/dark/system theme, accent colors, resume/invoice drafts.
- **Browse:** 480-action catalog from the user backlog with *planned* labels on tools not implemented natively.

Mobile implementations have deliberate limits. PDF operations use `pdf-lib`, images use the platform's codec support, and very large files may exceed phone memory. PDF editing does not preserve digital signatures. PDF rendering, full-fidelity DOCX/PPTX conversions, voice separation and FFmpeg media transcoding are **not implemented on mobile**. Those features require separate native libraries and device QA and are never shown as working buttons.

## Development setup

Expo SDK 58 needs **Node.js 22.13+**. Install packages with Node/npm on your **D:** drive rather than the nearly-full C: drive.

```powershell
cd D:\Github\local-tools
npm.cmd install --workspace @local-tools/mobile --include-workspace-root --no-audit --no-fund
npm.cmd run typecheck --workspace @local-tools/mobile
npm.cmd run start --workspace @local-tools/mobile
```

To run using Expo Go, your device's Expo Go must support SDK 58; as of the SDK 58 release Expo recommended a development build while store versions were rolling out. A development build can be created using EAS or a local Android SDK.

To request a preview **Android APK** from EAS:

```powershell
cd apps\mobile
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build --platform android --profile preview
```

EAS requires an Expo account, an internet connection and explicit authorization for the build service. **No signed APK or App Store release is provided here.** For iOS use a macOS native build or EAS with the appropriate Apple signing setup.

## Privacy and persistence

The app does not implement analytics or a file-upload API. Chosen files are copied into sandboxed temporary storage by the OS picker. Converted files are stored locally, and users can choose to export them using the platform share sheet. Sharing to a cloud app may transmit files and is controlled by the user. SQLite saves only favorites, settings, draft form fields and recent tool/output names, not full input documents.

## Development/build validation

`npm run typecheck --workspace @local-tools/mobile` validates TS source. `npx expo export --platform android` bundles JavaScript but does not prove native module compatibility on real Android/iOS devices. Always test document selection, persistence, PDF processing, printing and file sharing on physical devices before calling this mobile app production-ready.
