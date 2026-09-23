# Architecture & Design Principles

This document outlines the architectural patterns and design principles governing the **PWABuilder TypeScript SDK**. The codebase is engineered to be reliable, maintainable, and easily tested in any modern JavaScript/TypeScript environment.

---

## 1. SOLID Principles Implementation

### Single Responsibility Principle (SRP)
Each class in the SDK is responsible for a single domain boundary:
* **`ReportClient`**: Orchestrates site analysis, polling, and scoring.
* **`ImageGeneratorClient`**: Dispatches image generation payloads and returns archive buffers.
* **`AndroidPackager`**: Manages CloudAPK lifecycle (enqueue, poll, download AAB/APK).
* **`WindowsPackager`**: Communicates with the MSIX packaging service.
* **`IosPackager`**: Communicates with the Apple Xcode wrapper generation endpoint.
* **`FetchHttpClient`**: Encapsulates raw HTTP transport mechanics.

### Open / Closed Principle (OCP)
The packaging and client architecture can be extended without modifying existing source code:
* Custom HTTP transport layers can be provided by implementing the `IHttpClient` interface.
* Platform options builders allow partial overrides while defaulting to sane analysis-derived values.

### Liskov Substitution Principle (LSP)
* Both `FetchHttpClient` and `MockHttpClient` implement `IHttpClient` with identical contracts and exception behavior.
* `PackageArchive` uniformly handles output from all three packaging platforms (Android, Windows, iOS).

### Interface Segregation Principle (ISP)
Interfaces are granular and domain-specific:
* Request options (`WindowsPackageOptions`, `AndroidPackageOptions`, `IosPackageOptions`) are isolated by platform.
* `IHttpClient` contains a single high-level `request<T>` method rather than bloated platform-specific methods.

### Dependency Inversion Principle (DIP)
High-level modules (`ReportClient`, `ImageGeneratorClient`, `AndroidPackager`) do not depend on the global `fetch` API directly. Instead, they depend on the `IHttpClient` abstraction injected via their constructors.

---

## 2. Object Calisthenics Rules Compliance

1. **Only One Level of Indentation per Method**:
   * Nested conditionals and loops are extracted into private helper methods.
2. **Don't Use the `else` Keyword**:
   * All branching uses early returns, guard clauses, or polymorphism.
3. **Wrap All Primitives and Strings**:
   * `AppUrl`: Guarantees URL validity and protocol safety.
   * `PackageId`: Guarantees compliant Android/Windows store package IDs.
   * `AppVersion`: Enforces semantic and store version specifications.
   * `ColorHex`: Ensures valid CSS/PWA hexadecimal colors.
4. **First-Class Collections**:
   * `ManifestIconCollection`: Encapsulates icon arrays and exposes domain queries (`getLargestSquareIcon`, `getMaskableIcon`, `hasSquare192`).
   * `CapabilitiesCollection`: Encapsulates capability audits and exposes domain logic (`isStoreReady`, `getScorePercentage`, `findMissingRequired`).
5. **One Dot per Line**:
   * Chained property lookups are decomposed into named intermediate variables.
6. **Don't Abbreviate**:
   * Meaningful, intention-revealing names (`timeoutMilliseconds`, `PackageArchive`, `OnProgressCallback`) are used throughout.
7. **Keep Entities Small**:
   * Methods are limited to ≤ 15 lines.
   * Classes are kept to ≤ 100 lines.
   * Modules are kept under 200 lines.
8. **No Public Getters/Setters**:
   * Objects expose domain operations rather than mutable state.

---

## 3. Fail-Fast Error Architecture

The SDK rejects invalid states at system boundaries immediately before performing expensive network calls:
* Invalid URLs throw `ValidationError` before an HTTP request is dispatched.
* Malformed package identifiers throw `ValidationError` during option preparation.
* Polling jobs that exceed configured deadlines throw `AnalysisTimeoutError`.
* Remote build failures provide structured platform logs via `PackagingJobError`.
