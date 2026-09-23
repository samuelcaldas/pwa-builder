import fs from "node:fs/promises";
import path from "node:path";
import * as fflate from "fflate";

/**
 * Resulting package ZIP archive produced by the packaging engine.
 */
export class PackageArchive {
  private readonly buffer: Buffer;
  private unzippedCache?: Record<string, Uint8Array>;

  public constructor(zipData: ArrayBuffer | Buffer | Uint8Array) {
    this.buffer = Buffer.isBuffer(zipData) ? zipData : Buffer.from(new Uint8Array(zipData));
  }

  public toBuffer(): Buffer {
    return this.buffer;
  }

  public getFileNames(): readonly string[] {
    return Object.keys(this.getUnzipped());
  }

  public async saveTo(destinationZipPath: string): Promise<void> {
    const dir = path.dirname(destinationZipPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(destinationZipPath, this.buffer);
  }

  public async extractTo(targetDirectory: string): Promise<readonly string[]> {
    const writtenPaths: string[] = [];
    const entries = Object.entries(this.getUnzipped());
    for (const [relativePath, data] of entries) {
      const fullPath = path.join(targetDirectory, relativePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, Buffer.from(data));
      writtenPaths.push(fullPath);
    }
    return Object.freeze(writtenPaths);
  }

  private getUnzipped(): Record<string, Uint8Array> {
    if (!this.unzippedCache) {
      this.unzippedCache = fflate.unzipSync(new Uint8Array(this.buffer));
    }
    return this.unzippedCache;
  }
}
