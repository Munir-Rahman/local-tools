# ToolNest: release-readiness and advertising policy (October 2026)

## Actual functionality versus catalog
The 5,000-item roadmap is not a list of 5,000 completed engines. Website, Android, iOS and desktop support differ. A tool is marked ready only when its input/output operation works with representative local files and the target installer has been tested.

## Why the Android build failed
The previous Android package name `com.localtools.private` contains a reserved Java keyword (`private`). The Android Gradle Plugin rejects it. It has been changed to `com.toolnest.app` (and iOS bundle identifier aligned). This is a different app identity: existing installations cannot be updated in place using the changed package name. Keep old installations and export/backup personal drafts and documents before uninstalling.

Use Expo EAS with the project's configured `preview` APK profile for signed device testing. The separate GitHub native APK is an **internal test build** and may be signed with a different key; do not rely on it for seamless updates. A successful CI build is not proof of physical phone file access. See https://docs.expo.dev/build-reference/apk/ .

## Platform rollout
- Web: use browser integration tests, real local PDF/image test fixtures, and offline PWA smoke tests.
- Android: TypeScript, Metro, native Gradle, APK signature verification, real handset picker/storage/share tests, airplane-mode test.
- iOS: EAS iOS build with Apple Developer credentials, provisioning and real iPhone/iPad testing. Expo Go is not a substitute for a signed IPA.
- Windows: signed NSIS installer from Windows GitHub Actions followed by installation, first launch, offline operation and uninstall test. Existing unsigned test artifacts are not public production releases.
- macOS: DMG is a development artifact until signed and notarized with Apple Developer ID credentials; Gatekeeper may block unsigned binaries.
- Linux: AppImage needs build verification plus live tests on representative Linux distributions.

## Three calendars
- Gregorian: ISO-style YYYY-MM-DD.
- Solar Hijri: Afghan Shamsi / Persian calendar calculated with local JavaScript Intl, not dependent on an API.
- Islamic Hijri: `islamic-civil` (tabular) calculation, **not** an astronomical moon sighting. Observed dates in Afghanistan may differ, and this calculator should not be used to certify religious observances without local confirmation.
- Offline conversion range: Gregorian dates 1900–2100.

## Advertising plan
The React website includes 8 labeled ad placements: homepage, catalog, footer, tools, articles, leaderboard, infeed and categories. They require a valid approved publisher client ID, ad unit IDs, HTTPS, and appropriate consent before they can serve live ads. The app cannot guarantee advertiser fill or revenue. No advertising revenue is implied by placeholder slots.

**Website**: after AdSense site approval and a compliant consent management integration, configure `VITE_ADSENSE_CLIENT_ID` and relevant `VITE_ADSENSE_SLOT_*` variables. Google AdSense Auto ads can be managed in the Google AdSense site dashboard, including in-page, anchor, side rail and vignette formats. Do not implement imitation modal ads, hidden placements, forced clicks or copy another site's ad content. See https://support.google.com/adsense/answer/9305577 and https://support.google.com/adsense/answer/48182 .

**Android/iOS**: AdMob needs a real Google Mobile Ads native SDK configured for compatible React Native/Expo dev builds, publisher account, approved units and relevant consents. The current labeled mobile placement is **only a placeholder**. Expo Go alone is not a sufficient production integration.

**Windows/macOS/Linux**: AdSense code is deliberately not embedded in the Electron desktop application, because AdSense policy disallows integrating AdSense ads into arbitrary software. Consider compliant desktop sponsorships only after the associated terms have been verified.

**Privacy**: Local file contents must never be sent to advertising providers; if network ads are enabled, disclose that an ad request itself sends device/browser and network-related data. Give users a meaningful privacy policy and required consent controls. Avoid rendering ad overlays on file controls or disguising ads as buttons.

## Suggested next real engines, not yet marked finished
Prioritize and verify: PDF/OCR text recognition; PDF↔editable DOCX conversions; PDF compression quality options; multi-step offline workflows; photo crop/redaction/upscaling; bank-statement structured extraction; image AVIF/HEIC codecs; digital signatures and certificates; batch conversions; and additional business calculators. Each requires an independent test matrix and any applicable security/compliance review.
