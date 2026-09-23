# Next.js & React Integration Guide

This guide describes how to integrate `pwa-builder-sdk` into Next.js (App Router or Pages Router) and React applications to automate asset generation and native store packaging.

---

## 1. Automated Asset Generation via Build Script

In Next.js projects, add a pre-build script in `scripts/generate-pwa-assets.ts`:

```typescript
import fs from "node:fs/promises";
import path from "node:path";
import { PwaBuilderSDK } from "pwa-builder-sdk";

async function main() {
  const sdk = new PwaBuilderSDK();
  const sourceIconPath = path.resolve("./public/icon-512x512.png");
  const iconBuffer = await fs.readFile(sourceIconPath);

  console.log("Generating multi-platform PWA assets...");
  const archive = await sdk.images.generate({
    baseImage: iconBuffer,
    platforms: ["android", "windows11", "ios"],
    backgroundColor: "#ffffff",
    padding: 0
  });

  const targetDir = path.resolve("./public/icons");
  await archive.extractTo(targetDir);
  console.log(`Assets successfully extracted to ${targetDir}`);
}

main().catch(console.error);
```

Add to `package.json`:
```json
{
  "scripts": {
    "generate:assets": "tsx scripts/generate-pwa-assets.ts",
    "prebuild": "pnpm run generate:assets"
  }
}
```

---

## 2. Programmatic Store Deployment Script

For post-deployment triggers (e.g. after deploying to production or a staging URL like `example.com`):

```typescript
import { PwaBuilderSDK } from "pwa-builder-sdk";

async function buildPackages() {
  const pwa = new PwaBuilderSDK();
  const productionUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";

  console.log(`Auditing ${productionUrl}...`);
  const report = await pwa.report.analyze(productionUrl);

  if (!report.canPackage) {
    throw new Error("Application manifest or service worker does not meet store requirements.");
  }

  console.log("Building Windows MSIX package...");
  const windowsPkg = await pwa.packaging.windows.buildFromAnalysis(report, {
    publisher: {
      displayName: "Example Organization",
      commonName: "CN=ExampleOrganization"
    }
  });
  await windowsPkg.saveTo("./dist/store/windows-package.zip");

  console.log("Building iOS package...");
  const iosPkg = await pwa.packaging.ios.buildFromAnalysis(report);
  await iosPkg.saveTo("./dist/store/ios-package.zip");

  console.log("Building Android package...");
  const androidPkg = await pwa.packaging.android.buildFromAnalysis(report);
  await androidPkg.saveTo("./dist/store/android-package.zip");

  console.log("All packages generated successfully!");
}

buildPackages().catch(console.error);
```
