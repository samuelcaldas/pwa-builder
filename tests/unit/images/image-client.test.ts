import { describe, it, expect } from "vitest";
import { ImageGeneratorClient } from "../../../src/images/image-client.js";
import { MockHttpClient } from "../../../src/core/http-client.js";
import { ValidationError } from "../../../src/core/errors.js";
import * as fflate from "fflate";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("ImageGeneratorClient", () => {
  // Create a minimal zip buffer using fflate for testing archive handling
  const fakeZip = fflate.zipSync({
    "android/icon-192.png": new Uint8Array([1, 2, 3]),
    "windows11/Square150x150Logo.png": new Uint8Array([4, 5, 6])
  });

  it("should generate store images and return ImageArchive", async () => {
    const mockHttp = new MockHttpClient();
    mockHttp.onPost("https://www.pwabuilder.com/api/images/generateStoreImages", {
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/zip" }),
      data: fakeZip.buffer
    });

    const client = new ImageGeneratorClient(mockHttp);
    const archive = await client.generate({
      baseImage: Buffer.from("fake-png-data"),
      platforms: ["android", "windows11"],
      backgroundColor: "#ffffff",
      padding: 0
    });

    expect(archive).toBeDefined();
    expect(archive.getFileNames()).toContain("android/icon-192.png");
    expect(archive.getFileNames()).toContain("windows11/Square150x150Logo.png");
  });

  it("should extract archive files to target directory", async () => {
    const mockHttp = new MockHttpClient();
    mockHttp.onPost("https://www.pwabuilder.com/api/images/generateStoreImages", {
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      data: fakeZip.buffer
    });

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pwa-test-extract-"));
    try {
      const client = new ImageGeneratorClient(mockHttp);
      const archive = await client.generate({
        baseImage: Buffer.from("fake-png-data"),
        platforms: ["android"]
      });

      const extracted = await archive.extractTo(tempDir);
      expect(extracted).toHaveLength(2);

      const exists = await fs.stat(path.join(tempDir, "android/icon-192.png"));
      expect(exists.isFile()).toBe(true);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should throw ValidationError when no platforms are selected", async () => {
    const mockHttp = new MockHttpClient();
    const client = new ImageGeneratorClient(mockHttp);

    await expect(
      client.generate({
        baseImage: Buffer.from("fake"),
        platforms: []
      })
    ).rejects.toThrow(ValidationError);
  });
});
