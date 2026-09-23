# pwa-builder-sdk

A production-ready TypeScript SDK and CLI for building native application packages (**Android Google Play / TWA**, **Microsoft Store Windows MSIX**, and **Apple App Store iOS Xcode project**) and generating multi-platform store visual assets using the official `PWABuilder.com` APIs.

[![CI Tests](https://img.shields.io/badge/tests-49%20passed-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)]()
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()

---

## Features

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
* 🛠️ **Architecture & Standards**:
  * Adheres strictly to **SOLID Principles**, **Object Calisthenics**, and **Clean Code**.
  * Zero-bloat runtime dependencies (native Node.js 18+ `fetch`, `FormData`, `Blob`).
  * 100% deterministic unit testing with `MockHttpClient` for offline TDD.
  * Ready-to-use CLI and GitHub Actions workflows for continuous store artifact deployment.

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

## Documentation

Full documentation is available in the [`./docs`](./docs/README.md) directory:
* [Architecture & Design Principles](./docs/architecture.md)
* [Full API Reference](./docs/api-reference.md)
* [CLI & GitHub Actions Guide](./docs/cli-usage.md)
* [Next.js & React Integration](./docs/nextjs-react-integration.md)
* [ADR 0001: Architecture Decision Record](./docs/adr/0001-pwabuilder-sdk-architecture.md)
