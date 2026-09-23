import type { AppUrl } from "./app-url.js";

/**
 * Manifest icon object contract.
 */
export interface ManifestIcon {
  readonly src: string;
  readonly sizes?: string;
  readonly type?: string;
  readonly purpose?: string;
}

/**
 * First-class collection wrapping and querying web app manifest icons.
 */
export class ManifestIconCollection {
  private readonly icons: readonly ManifestIcon[];

  public constructor(icons?: readonly ManifestIcon[]) {
    this.icons = Object.freeze([...(icons ?? [])]);
  }

  public all(): readonly ManifestIcon[] {
    return this.icons;
  }

  public getLargestSquareIcon(minSize = 0): ManifestIcon | null {
    const squareIcons = this.icons.filter(i => this.isSquare(i));
    const sorted = squareIcons.sort((a, b) => this.extractDimension(b) - this.extractDimension(a));
    const candidate = sorted[0];
    if (candidate && this.extractDimension(candidate) >= minSize) {
      return candidate;
    }
    return null;
  }

  public getMaskableIcon(): ManifestIcon | null {
    const maskable = this.icons.find(i => (i.purpose ?? "").includes("maskable"));
    return maskable ?? null;
  }

  public hasSquare192(): boolean {
    return this.hasSquareOfSize(192);
  }

  public hasSquare512(): boolean {
    return this.hasSquareOfSize(512);
  }

  public resolveUrls(baseUrl: AppUrl): ManifestIconCollection {
    const resolved = this.icons.map(icon => ({
      ...icon,
      src: baseUrl.resolve(icon.src).toString()
    }));
    return new ManifestIconCollection(resolved);
  }

  private hasSquareOfSize(size: number): boolean {
    const targetSize = `${size}x${size}`;
    return this.icons.some(i => i.sizes === targetSize);
  }

  private isSquare(icon: ManifestIcon): boolean {
    const dim = this.extractDimension(icon);
    return dim > 0;
  }

  private extractDimension(icon: ManifestIcon): number {
    const match = /^(\d+)x\1$/i.exec((icon.sizes || "").trim());
    if (match?.[1]) {
      return Number.parseInt(match[1], 10);
    }
    return 0;
  }
}
