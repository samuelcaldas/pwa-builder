import { describe, it, expect } from "vitest";
import { AndroidPackager } from "../../../src/packaging/android/android-packager.js";
import { MockHttpClient } from "../../../src/core/http-client.js";
import { PackagingJobError } from "../../../src/core/errors.js";
import * as fflate from "fflate";
import type { AndroidPackageOptions } from "../../../src/packaging/android/types.js";
import type { PwaAnalysisResult } from "../../../src/report/types.js";

describe("AndroidPackager", () => {
  const fakeZip = fflate.zipSync({
    "app-release.aab": new Uint8Array([1, 2, 3]),
    "assetlinks.json": new Uint8Array([4, 5, 6])
  });

  const sampleAnalysis: PwaAnalysisResult = {
    id: "analysis:example:1",
    url: "https://example.com/",
    status: "Completed",
    canPackage: true,
    capabilities: [],
    webManifest: {
      url: "https://example.com/manifest.json",
      manifest: {
        name: "Example App",
        short_name: "App",
        start_url: "/dashboard",
        icons: [
          { src: "https://example.com/icon-512x512.png", sizes: "512x512", purpose: "any" },
          { src: "https://example.com/maskable-icon-512x512.png", sizes: "512x512", purpose: "maskable" }
        ]
      }
    }
  };

  it("should enqueue, poll, and download Android package bundle", async () => {
    const mockHttp = new MockHttpClient();
    mockHttp.onPost("https://pwabuilder-cloudapk.azurewebsites.net/enqueuePackageJob", {
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      data: '"job:android:123"'
    });
    mockHttp.onGet("https://pwabuilder-cloudapk.azurewebsites.net/getPackageJob?id=job%3Aandroid%3A123", {
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      data: {
        id: "job:android:123",
        status: "Completed",
        logs: ["Generated bundle", "Signed APK"]
      }
    });
    mockHttp.onGet("https://pwabuilder-cloudapk.azurewebsites.net/downloadPackageZip?id=job%3Aandroid%3A123", {
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/zip" }),
      data: fakeZip.buffer
    });

    const packager = new AndroidPackager(mockHttp);
    const options: AndroidPackageOptions = {
      appVersion: "1.0.0.0",
      appVersionCode: 1,
      backgroundColor: "#ffffff",
      display: "standalone",
      enableNotifications: true,
      enableSiteSettingsShortcut: true,
      fallbackType: "customtabs",
      features: { locationDelegation: { enabled: false }, playBilling: { enabled: false } },
      host: "example.com",
      iconUrl: "https://example.com/icon-512x512.png",
      maskableIconUrl: "https://example.com/maskable-icon-512x512.png",
      name: "Example App",
      launcherName: "Example",
      packageId: "com.example.app.twa",
      startUrl: "/dashboard",
      themeColor: "#000000",
      webManifestUrl: "https://example.com/manifest.json",
      pwaUrl: "https://example.com"
    };

    const result = await packager.build(options, { intervalMs: 10, timeoutMs: 1000 });
    expect(result).toBeDefined();
    expect(result.toBuffer().length).toBeGreaterThan(0);
    expect(result.getFileNames()).toContain("app-release.aab");
  });

  it("should build Android package from analysis result", async () => {
    const mockHttp = new MockHttpClient();
    mockHttp.onPost("https://pwabuilder-cloudapk.azurewebsites.net/enqueuePackageJob", {
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      data: '"job:android:analysis"'
    });
    mockHttp.onGet("https://pwabuilder-cloudapk.azurewebsites.net/getPackageJob?id=job%3Aandroid%3Aanalysis", {
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      data: {
        id: "job:android:analysis",
        status: "Completed",
        logs: ["Done"]
      }
    });
    mockHttp.onGet("https://pwabuilder-cloudapk.azurewebsites.net/downloadPackageZip?id=job%3Aandroid%3Aanalysis", {
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/zip" }),
      data: fakeZip.buffer
    });

    const packager = new AndroidPackager(mockHttp);
    const result = await packager.buildFromAnalysis(sampleAnalysis, undefined, { intervalMs: 10, timeoutMs: 1000 });
    expect(result).toBeDefined();
  });

  it("should throw PackagingJobError when CloudAPK fails build", async () => {
    const mockHttp = new MockHttpClient();
    mockHttp.onPost("https://pwabuilder-cloudapk.azurewebsites.net/enqueuePackageJob", {
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      data: '"job:fail:1"'
    });
    mockHttp.onGet("https://pwabuilder-cloudapk.azurewebsites.net/getPackageJob?id=job%3Afail%3A1", {
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      data: {
        id: "job:fail:1",
        status: "Failed",
        errors: ["Gradle build error: out of memory"],
        logs: ["Starting gradle", "Error: failed compilation"]
      }
    });

    const packager = new AndroidPackager(mockHttp);
    const options: AndroidPackageOptions = {
      appVersion: "1.0.0.0",
      appVersionCode: 1,
      backgroundColor: "#ffffff",
      display: "standalone",
      enableNotifications: true,
      enableSiteSettingsShortcut: true,
      fallbackType: "customtabs",
      features: { locationDelegation: { enabled: false }, playBilling: { enabled: false } },
      host: "example.com",
      iconUrl: "https://example.com/icon-512x512.png",
      maskableIconUrl: "https://example.com/maskable-icon-512x512.png",
      name: "Example App",
      launcherName: "Example",
      packageId: "com.example.app.twa",
      startUrl: "/dashboard",
      themeColor: "#000000",
      webManifestUrl: "https://example.com/manifest.json",
      pwaUrl: "https://example.com"
    };

    await expect(packager.build(options, { intervalMs: 10, timeoutMs: 1000 })).rejects.toThrow(
      PackagingJobError
    );
  });
});
