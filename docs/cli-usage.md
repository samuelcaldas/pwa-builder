# CLI & CI/CD Workflows

The SDK includes a command-line interface (`pwabuilder-sdk` / `pwa-sdk`) designed for developer scripts, automated builds, and GitHub Actions CI/CD workflows.

---

## Command Reference

### 1. `audit` - Audit PWA Store Readiness
Runs an audit against a deployed PWA URL and outputs either Markdown or JSON.

```bash
# Human-readable Markdown output (default)
npx pwa-builder-sdk audit https://example.com

# Machine-readable JSON output
npx pwa-builder-sdk audit https://example.com --format json > report.json
```

---

### 2. `assets` - Generate Store Icon Sets
Generates complete store icon packages (Android adaptive/maskable, Windows tile logos, iOS app icons) from a single 512x512 source image.

```bash
npx pwa-builder-sdk assets ./public/icon-512x512.png \
  --platforms android,windows11,ios \
  --out ./public/icons/store
```

---

### 3. `package` - Build Native App Store Bundles
Performs full automated packaging for one or all platforms directly from the live URL.

```bash
# Build for all platforms (Windows MSIX, iOS Xcode, Android TWA)
npx pwa-builder-sdk package https://example.com \
  --platform all \
  --out ./dist/pwa

# Build only Windows MSIX
npx pwa-builder-sdk package https://example.com \
  --platform windows \
  --out ./dist/pwa
```

---

## GitHub Actions CI/CD Workflow Example

Create `.github/workflows/build-store-packages.yml`:

```yaml
name: Build PWA Store Packages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  package:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install Dependencies
        run: npm ci

      - name: Audit PWA Readiness
        run: npx pwa-builder-sdk audit https://example.com

      - name: Generate Store Packages
        run: |
          npx pwa-builder-sdk package https://example.com \
            --platform all \
            --out ./dist/pwa

      - name: Upload Store Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: pwa-store-packages
          path: ./dist/pwa/**/*.zip
```
