# pwa-builder-sdk

A robust, type-safe TypeScript SDK and CLI designed to audit Progressive Web Apps (PWAs), generate multi-platform adaptive store icons, and build native app store packages for **Android (Google Play / TWA)**, **Microsoft Store (Windows MSIX)**, and **Apple App Store (iOS Xcode project)** using the official `PWABuilder.com` APIs.

---

## Key Features

* 📊 **Report Card & Audit Engine**:
  * Programmatic evaluation of over 50 PWA capability checks (Manifest, Service Worker, HTTPS, General).
  * Store readiness detection (`canPackage: true/false`).
  * Structured scorecard and Markdown report generation.
* 🎨 **App Image Generator**:
  * Automatic generation of multi-platform icons, splash screens, and maskable assets from a single 512x512 PNG.
  * Direct extraction to disk or in-memory zip processing.
* 📦 **Packaging Engine**:
  * **Android**: Generates Trusted Web Activity (TWA) packages containing `.aab`, `.apk`, `assetlinks.json`, and Gradle source code via CloudAPK.
  * **Microsoft Store**: Generates digitally signed `.msix` bundles with modern Windows app manifest and visual assets.
  * **iOS**: Generates Xcode projects with Swift and WebKit wrappers ready for App Store Connect.
* 🛠️ **Developer Experience & Architecture**:
  * Adheres strictly to **SOLID Principles**, **Object Calisthenics**, and **Clean Code**.
  * Zero-bloat runtime dependencies (native Node.js 18+ `fetch`, `FormData`, `Blob`).
  * 100% deterministic unit testing with `MockHttpClient` for offline TDD.
  * Ready-to-use CLI and GitHub Actions workflows for continuous store artifact deployment.

---

## Installation

```bash
# Using pnpm
pnpm add pwa-builder-sdk

# Using npm
npm install pwa-builder-sdk

# Using yarn
yarn add pwa-builder-sdk
```

---

## Quickstart

```typescript
import { PwaBuilderSDK } from "pwa-builder-sdk";

const pwa = new PwaBuilderSDK();

// 1. Audit site
const report = await pwa.report.analyze("https://example.com");
console.log(`Store ready: ${report.canPackage ? "YES" : "NO"}`);

// 2. Generate Store Images
const iconBuffer = await fetch("https://example.com/icon-512x512.png")
  .then(res => res.arrayBuffer());

const images = await pwa.images.generate({
  baseImage: Buffer.from(iconBuffer),
  platforms: ["android", "windows11", "ios"]
});
await images.extractTo("./public/store-icons");

// 3. Package for Windows MSIX
const winArchive = await pwa.packaging.windows.buildFromAnalysis(report, {
  publisher: {
    displayName: "Example Organization",
    commonName: "CN=ExampleOrganization"
  }
});
await winArchive.saveTo("./dist/windows-package.zip");

// 4. Package for Android TWA / Google Play
const androidArchive = await pwa.packaging.android.buildFromAnalysis(report);
await androidArchive.saveTo("./dist/android-bundle.zip");
```

---

## Documentation Navigation

* [Architecture & Principles](./architecture.md) - SOLID, Object Calisthenics, and domain model design.
* [API Reference](./api-reference.md) - Complete class and interface documentation.
* [CLI & GitHub Actions Guide](./cli-usage.md) - Command-line interface and CI/CD pipelines.
* [Next.js & React Integration](./nextjs-react-integration.md) - Automated asset and store packaging in Next.js.
* [ADR 0001: Architecture Decision Record](./adr/0001-pwabuilder-sdk-architecture.md) - Technical rationale.
