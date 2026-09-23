import { describe, it, expect } from "vitest";
import { WindowsPackager } from "../../../src/packaging/windows/windows-packager.js";
import { MockHttpClient } from "../../../src/core/http-client.js";
import * as fflate from "fflate";
import type { WindowsPackageOptions } from "../../../src/packaging/windows/types.js";
import type { PwaAnalysisResult } from "../../../src/report/types.js";

describe("WindowsPackager", () => {
  const fakeZip = fflate.zipSync({
    "App.msix": new Uint8Array([1, 2, 3])
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

  it("should package Windows MSIX from explicit options", async () => {
    const mockHttp = new MockHttpClient();
    mockHttp.onPost("https://pwabuilder-windows-docker.azurewebsites.net/msix/generatezip", {
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/zip" }),
      data: fakeZip.buffer
    });

    const packager = new WindowsPackager(mockHttp);
    const options: WindowsPackageOptions = {
      name: "Example App",
      packageId: "ExampleCorp.App",
      url: "https://example.com/dashboard",
      version: "1.0.1",
      publisher: {
        displayName: "Example Organization",
        commonName: "CN=ExampleOrganization"
      },
      manifestUrl: "https://example.com/manifest.json",
      manifest: sampleAnalysis.webManifest!.manifest,
      images: {
        baseImage: "https://example.com/icon-512x512.png"
      }
    };

    const packageResult = await packager.build(options);
    expect(packageResult).toBeDefined();
    expect(packageResult.toBuffer().length).toBeGreaterThan(0);
    expect(packageResult.getFileNames()).toContain("App.msix");
  });

  it("should construct options automatically from analysis result", async () => {
    const mockHttp = new MockHttpClient();
    mockHttp.onPost("https://pwabuilder-windows-docker.azurewebsites.net/msix/generatezip", {
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      data: fakeZip.buffer
    });

    const packager = new WindowsPackager(mockHttp);
    const packageResult = await packager.buildFromAnalysis(sampleAnalysis, {
      publisher: {
        displayName: "Example Organization",
        commonName: "CN=Example"
      }
    });

    expect(packageResult).toBeDefined();
  });
});
