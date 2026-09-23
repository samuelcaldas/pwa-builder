import { describe, it, expect } from "vitest";
import { ManifestIconCollection, type ManifestIcon } from "../../../src/domain/manifest-icons.js";
import { CapabilitiesCollection, type Capability } from "../../../src/domain/capabilities.js";
import { AppUrl } from "../../../src/domain/app-url.js";

describe("Domain First-Class Collections", () => {
  describe("ManifestIconCollection", () => {
    const sampleIcons: ManifestIcon[] = [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ];

    it("should find largest square icon", () => {
      const collection = new ManifestIconCollection(sampleIcons);
      const largest = collection.getLargestSquareIcon();
      expect(largest).toBeDefined();
      expect(largest?.sizes).toBe("512x512");
      expect(largest?.src).toBe("/icon-512x512.png");
    });

    it("should find maskable icon", () => {
      const collection = new ManifestIconCollection(sampleIcons);
      const maskable = collection.getMaskableIcon();
      expect(maskable).toBeDefined();
      expect(maskable?.purpose).toBe("maskable");
      expect(maskable?.sizes).toBe("512x512");
    });

    it("should verify presence of 192 and 512 icons", () => {
      const collection = new ManifestIconCollection(sampleIcons);
      expect(collection.hasSquare192()).toBe(true);
      expect(collection.hasSquare512()).toBe(true);
    });

    it("should resolve relative icon paths against base URL", () => {
      const collection = new ManifestIconCollection(sampleIcons);
      const baseUrl = new AppUrl("https://example.com");
      const resolved = collection.resolveUrls(baseUrl);

      const items = resolved.all();
      expect(items[0]?.src).toBe("https://example.com/icon-192x192.png");
      expect(items[1]?.src).toBe("https://example.com/icon-512x512.png");
    });
  });

  describe("CapabilitiesCollection", () => {
    const sampleCapabilities: Capability[] = [
      { id: "ServesHtml", level: "Required", category: "General", status: "Passed", description: "HTML" },
      { id: "HasHttps", level: "Required", category: "Https", status: "Passed", description: "HTTPS" },
      { id: "Icons", level: "Required", category: "WebAppManifest", status: "Passed", description: "Icons" },
      { id: "Screenshots", level: "Recommended", category: "WebAppManifest", status: "Failed", description: "Screenshots" },
      { id: "ServiceWorker", level: "Recommended", category: "ServiceWorker", status: "Failed", description: "SW" },
      { id: "Offline", level: "Feature", category: "ServiceWorker", status: "Skipped", description: "Offline" }
    ];

    it("should filter passed and failed capabilities", () => {
      const collection = new CapabilitiesCollection(sampleCapabilities);
      expect(collection.getPassed()).toHaveLength(3);
      expect(collection.getFailed()).toHaveLength(2);
      expect(collection.getSkipped()).toHaveLength(1);
    });

    it("should verify store readiness when no required capabilities fail", () => {
      const collection = new CapabilitiesCollection(sampleCapabilities);
      expect(collection.isStoreReady()).toBe(true);
      expect(collection.findMissingRequired()).toHaveLength(0);
    });

    it("should calculate correct score percentage", () => {
      const collection = new CapabilitiesCollection(sampleCapabilities);
      // 3 passed out of 5 evaluated (excluding skipped) = 60%
      expect(collection.getScorePercentage()).toBe(60);
    });
  });
});
