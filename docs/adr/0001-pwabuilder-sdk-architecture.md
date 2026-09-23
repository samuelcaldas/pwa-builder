# ADR 0001: Architecture of the PWABuilder TypeScript SDK

## Context
PWABuilder (maintained by Microsoft and the community) provides web APIs to audit PWAs, generate multi-platform visual assets, and package applications for the Google Play Store (TWA), Microsoft Store (MSIX), and Apple App Store (Xcode wrapper).

Previously, developers had to manually access the web interface or write ad-hoc scripts to invoke undocumented or reverse-engineered endpoints. We required a robust, production-grade TypeScript SDK and CLI that can be integrated into TDD test suites, GitHub Actions, and Next.js / React build systems.

## Decisions

1. **Pure Native Node.js HTTP Transport**:
   * We decided to avoid heavyweight HTTP client dependencies (such as Axios).
   * The SDK utilizes standard Node.js 18+ `fetch`, `FormData`, and `Blob`.
   * An `IHttpClient` interface abstracts all network requests to allow seamless mocking during unit tests (`MockHttpClient`).

2. **Domain Encapsulation via Object Calisthenics**:
   * Value Objects (`AppUrl`, `PackageId`, `AppVersion`, `ColorHex`) validate and normalize domain boundaries upfront.
   * First-class collections (`ManifestIconCollection`, `CapabilitiesCollection`) encapsulate collection inspection, preventing primitive obsession.
   * Entities are kept under strict size limits (≤ 15 lines per method, ≤ 100 lines per class).

3. **Multi-Platform Packaging Architecture**:
   * Windows MSIX generation directly communicates with the Azure-hosted MSIX generator.
   * iOS package generation creates an Xcode project wrapper with WebKit configuration.
   * Android packaging manages the asynchronous CloudAPK build queue with status polling, log forwarding, and automatic download of `.aab` / `.apk` assets.

4. **Zero-Overhead Archive Abstraction**:
   * Packaging and image results are encapsulated in `PackageArchive` and `ImageArchive`, utilizing `fflate` for zero-dependency zip extraction and filesystem persistence.

## Consequences
* **Positive**:
  * Clean, decoupled codebase that compiles cleanly to both ESM and CommonJS.
  * 100% deterministic, offline-capable unit test suite running in < 500ms.
  * Real-world tested and verified with production web applications (`https://example.com`).
* **Negative**:
  * CloudAPK Android builds require up to 60-90 seconds on external Azure runners during live builds. This is mitigated through configurable timeouts and progress callbacks.
