import { describe, it, expect } from "vitest";
import { PwaBuilderSDK } from "../../src/client.js";

describe("Live PWABuilder Pipeline against pwabuilder.com", () => {
  const targetUrl = "https://www.pwabuilder.com";
  const sdk = new PwaBuilderSDK();

  it("should perform live report analysis and verify store readiness", async () => {
    const report = await sdk.report.analyze(targetUrl, { timeoutMs: 60000 });
    expect(report).toBeDefined();
    expect(report.status).toBe("Completed");
    expect(report.canPackage).toBe(true);
    expect(report.webManifest).toBeDefined();

    const summary = sdk.report.summarize(report);
    expect(summary.canPackage).toBe(true);
    expect(summary.passedCapabilities).toBeGreaterThanOrEqual(10);
  }, 75000);

  it("should generate store images from base image", async () => {
    const fakePngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

    const archive = await sdk.images.generate({
      baseImage: fakePngBuffer,
      platforms: ["android", "windows11", "ios"],
      backgroundColor: "#ffffff",
      padding: 0
    });

    expect(archive).toBeDefined();
    expect(archive.toBuffer().length).toBeGreaterThan(0);
    expect(archive.getFileNames().length).toBeGreaterThan(0);
  }, 45000);

  it("should build live iOS Xcode package from analysis", async () => {
    const report = await sdk.report.analyze(targetUrl, { timeoutMs: 60000 });
    const iosArchive = await sdk.packaging.ios.buildFromAnalysis(report);

    expect(iosArchive).toBeDefined();
    expect(iosArchive.toBuffer().length).toBeGreaterThan(500000); // > 500KB
    expect(iosArchive.getFileNames().some(f => f.includes("xcodeproj"))).toBe(true);
  }, 75000);

  it("should build live Windows MSIX package from analysis", async () => {
    const report = await sdk.report.analyze(targetUrl, { timeoutMs: 60000 });
    const winArchive = await sdk.packaging.windows.buildFromAnalysis(report, {
      publisher: {
        displayName: "Example Organization",
        commonName: "CN=ExampleOrganization"
      }
    });

    expect(winArchive).toBeDefined();
    expect(winArchive.toBuffer().length).toBeGreaterThan(1000000); // > 1MB
  }, 90000);
});
