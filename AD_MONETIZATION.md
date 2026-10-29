# ToolNest advertising integration — not active until configured

ToolNest is a **free, offline-processing** utility suite. Advertising is online-only and will send ad-request metadata to advertising providers. The selected PDFs, videos, images, and documents remain on-device. We must clearly disclose these different data flows and obtain required consent.

## Web: Google AdSense

1. Deploy a public HTTPS website with original content and the required privacy/cookie documentation. Obtain approval from Google AdSense; approval and ad fill are not guaranteed.
2. Set `VITE_ADSENSE_CLIENT_ID=ca-pub-...`, `VITE_ADSENSE_SLOT_HOME=...`, `VITE_ADSENSE_SLOT_CATALOG=...`, `VITE_ADSENSE_SLOT_TOOLS=...`, `VITE_ADSENSE_SLOT_ARTICLE=...`, `VITE_ADSENSE_SLOT_FOOTER=...` in the web production build environment. Rebuild.
3. Integrate a **Google-certified consent management platform (CMP)** where required. Your CMP must set `window.__toolnestAdsConsent = true` **only after advertising is allowed** and trigger `window.dispatchEvent(new Event('toolnest-consent-updated'))`. Set it to false when permissions are withdrawn and reload or stop ad requests. This bridge is NOT itself a CMP.
4. Review Content Security Policy against the exact ad networks serving your site and integrate `ads.txt` provided by AdSense at the hosting domain. Do not put publisher IDs or ad network script URLs into the local conversion engines.
5. Slots are reserved on the dashboard, tool collection, catalog, information articles and footer, separated from upload/download/process controls. Slots never print. Localhost and offline mode show only inert placeholders.

**Do not** ask people to click ads, imply ads are download buttons, use forced ad clicks, place ads immediately next to actions or show ads in print pages. Web AdSense cannot be embedded directly in ordinary native desktop apps; use native-app-approved inventory, sponsorship, or affiliates for desktop (subject to provider policies).

Google policy: https://support.google.com/adsense/answer/1346295

## Android and iOS: Google AdMob

A native AdMob integration needs **your actual Android/iOS AdMob App IDs and ad-unit IDs**. The current mobile release reserves a clearly labeled, noninteractive banner area but deliberately makes **no ad requests**.

Integration when your accounts and mobile build are ready:

1. `cd apps/mobile && npx expo install react-native-google-mobile-ads expo-dev-client`
2. Add the official Expo config plugin in `apps/mobile/app.json` with your actual Google AdMob App IDs. Never substitute a banner ad unit ID for an application ID.
3. Use the package's consent API (UMP) before requesting ads. Use official test ad-unit IDs on development devices and never click live ads during QA.
4. In a dedicated component, display an adaptive banner only when consent permits; add native ad slots at the home/catalog sections, not adjacent to processing, file picking, download, or navigation buttons.
5. Create and test an **EAS development build or APK**. Native AdMob SDKs do not work inside Expo Go.
6. Configure privacy policy, app-store disclosures and your consent platform before release.

Documentation: https://github.com/invertase/react-native-google-mobile-ads and https://developers.google.com/admob/android/privacy

## Desktop

Regular Google AdSense placements are NOT permitted in standalone desktop software. The desktop app has no ads implemented; monetize through permitted affiliate links, voluntary donations, sponsorship placements, or an ad solution explicitly authorized for desktop software.

## Privacy requirements

- Local file processing remains offline-capable, but ad inventory is online-only.
- Never attach file contents, filenames, sensitive PDF metadata or recent processing history to advertising requests.
- Do not store ad tracking data in the local SQLite database unless explicitly disclosed and allowed.
- Ensure ad slots are hidden for exported PDFs and printable templates.

## Launch gate

Current state: web AdSense adapter/scaffold and native reserved placements, not live ads. Publisher/consent integration, mobile AdMob SDK wiring, domain verification and device tests remain prerequisites.
