# API Reference

Complete reference for all classes, methods, value objects, and interfaces provided by `pwa-builder-sdk`.

---

## 1. Main Facade: `PwaBuilderSDK`

The primary entry point to all SDK subsystems.

```typescript
import { PwaBuilderSDK } from "pwa-builder-sdk";

const pwa = new PwaBuilderSDK({
  httpClient?: IHttpClient,
  baseUrl?: string,
  cloudApkUrl?: string,
  windowsGeneratorUrl?: string
});
```

### Properties
* `pwa.report: ReportClient` - Site audit, capability scoring, and report summaries.
* `pwa.images: ImageGeneratorClient` - Multi-platform asset generation from base icon.
* `pwa.packaging.android: AndroidPackager` - Google Play / TWA packaging.
* `pwa.packaging.windows: WindowsPackager` - Microsoft Store MSIX packaging.
* `pwa.packaging.ios: IosPackager` - Apple App Store Xcode wrapper packaging.

---

## 2. Report Module

### `ReportClient`
* `enqueue(url: AppUrl | string): Promise<string>`
  * Dispatches an analysis job for the target URL. Returns the analysis `jobId`.
* `fetchStatus(jobId: string): Promise<PwaAnalysisResult | null>`
  * Retrieves current job status. Returns `null` if still processing (204).
* `analyze(url: AppUrl | string, options?: AnalysisPollOptions): Promise<PwaAnalysisResult>`
  * High-level helper: enqueues and polls until job finishes or times out.
* `summarize(analysis: PwaAnalysisResult): ReportSummary`
  * Generates structured pass/fail metrics and human-readable Markdown.

### `ReportSummary`
* `canPackage: boolean`
* `totalCapabilities: number`
* `passedCapabilities: number`
* `failedCapabilities: number`
* `scorePercentage: number`
* `toMarkdown(): string`

---

## 3. App Image Generator Module

### `ImageGeneratorClient`
* `generate(options: ImageGenerationOptions): Promise<ImageArchive>`
  * Generates all platform assets (Android, Windows, iOS) from a base image.

### `ImageGenerationOptions`
* `baseImage: Buffer | Uint8Array | Blob` - Square PNG image (preferably 512x512).
* `platforms: ("android" | "ios" | "windows11")[]` - Target platform list.
* `backgroundColor?: string` - Hex color code (e.g. `#ffffff`).
* `padding?: number` - Icon padding ratio (e.g. `0` or `0.3`).

### `ImageArchive`
* `toBuffer(): Buffer` - In-memory ZIP buffer.
* `getFileNames(): readonly string[]` - List of generated file paths.
* `extractTo(targetDir: string): Promise<readonly string[]>` - Extracts files directly to disk.

---

## 4. Packaging Engine

### `WindowsPackager`
* `build(options: WindowsPackageOptions): Promise<PackageArchive>`
* `buildFromAnalysis(analysis: PwaAnalysisResult, overrides?: Partial<WindowsPackageOptions>): Promise<PackageArchive>`
  * Automatically populates publisher, start URL, package ID, and icon from analysis.

### `IosPackager`
* `build(options: IosPackageOptions): Promise<PackageArchive>`
* `buildFromAnalysis(analysis: PwaAnalysisResult, overrides?: Partial<IosPackageOptions>): Promise<PackageArchive>`

### `AndroidPackager`
* `build(options: AndroidPackageOptions, pollOptions?: AndroidPollOptions): Promise<PackageArchive>`
* `buildFromAnalysis(analysis: PwaAnalysisResult, overrides?: Partial<AndroidPackageOptions>, pollOptions?: AndroidPollOptions): Promise<PackageArchive>`

### `PackageArchive`
* `toBuffer(): Buffer`
* `saveTo(destinationZipPath: string): Promise<void>`
* `extractTo(targetDirectory: string): Promise<readonly string[]>`
* `getFileNames(): readonly string[]`

---

## 5. Domain Value Objects

* **`AppUrl`**: Validated HTTP/HTTPS web application URL.
  * Methods: `.origin`, `.hostname`, `.pathname`, `.resolve(path)`, `.toString()`.
* **`PackageId`**: Validated platform package name (e.g. `com.example.app.twa`).
  * Static: `PackageId.fromHostname(hostname)`.
* **`AppVersion`**: Semantic and store version representation (`1.0.1` vs `1.0.1.0`).
  * Methods: `.toStoreVersion()`, `.toQuadVersion()`.
* **`ColorHex`**: Validated CSS hexadecimal color (supports 3/6/8 digits and `transparent`).

---

## 6. First-Class Collections

* **`ManifestIconCollection`**: Encapsulation of manifest icons.
  * `.getLargestSquareIcon(minSize?: number)`
  * `.getMaskableIcon()`
  * `.hasSquare192()`
  * `.hasSquare512()`
  * `.resolveUrls(baseUrl: AppUrl)`
* **`CapabilitiesCollection`**: Encapsulation of PWA capability audits.
  * `.getPassed()`
  * `.getFailed()`
  * `.getSkipped()`
  * `.findMissingRequired()`
  * `.isStoreReady()`
  * `.getScorePercentage()`
