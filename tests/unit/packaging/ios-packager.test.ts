import { describe, it, expect } from "vitest";
import { IosPackager } from "../../../src/packaging/ios/ios-packager.js";
import { MockHttpClient } from "../../../src/core/http-client.js";
import * as fflate from "fflate";
import type { IosPackageOptions } from "../../../src/packaging/ios/types.js";
import type { PwaAnalysisResult } from "../../../src/report/types.js";

describe("IosPackager", () => {
  const fakeZip = fflate.zipSync({
    "App.xcodeproj/project.pbxproj": new Uint8Array([1, 2, 3])
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
        icons: [{ src: "https://example.com/icon-512x512.png", sizes: "512x512" }]
      }
    }
  };

  it("should generate iOS Xcode package from options", async () => {
    const mockHttp = new MockHttpClient();
    mockHttp.onPost("https://www.pwabuilder.com/api/iospackage/create", {
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/zip" }),
      data: fakeZip.buffer
    });

    const packager = new IosPackager(mockHttp);
    const options: IosPackageOptions = {
      name: "Example App",
      bundleId: "com.example.app",
      url: "https://example.com/dashboard",
      imageUrl: "https://example.com/icon-512x512.png",
      splashColor: "#ffffff",
      progressBarColor: "#000000",
      statusBarColor: "#ffffff",
      manifestUrl: "https://example.com/manifest.json",
      manifest: sampleAnalysis.webManifest!.manifest
    };

    const result = await packager.build(options);
    expect(result).toBeDefined();
    expect(result.toBuffer().length).toBeGreaterThan(0);
    expect(result.getFileNames()).toContain("App.xcodeproj/project.pbxproj");
  });

  it("should construct iOS package from analysis result", async () => {
    const mockHttp = new MockHttpClient();
    mockHttp.onPost("https://www.pwabuilder.com/api/iospackage/create", {
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      data: fakeZip.buffer
    });

    const packager = new IosPackager(mockHttp);
    const result = await packager.buildFromAnalysis(sampleAnalysis);
    expect(result).toBeDefined();
  });
});
