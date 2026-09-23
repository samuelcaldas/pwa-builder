import { ValidationError } from "../core/errors.js";

/**
 * Value Object representing a validated Application Semantic Version.
 */
export class AppVersion {
  private readonly major: number;
  private readonly minor: number;
  private readonly patch: number;
  private readonly build: number;

  public constructor(rawVersion: string) {
    const parts = this.parseParts(rawVersion);
    this.major = parts[0]!;
    this.minor = parts[1]!;
    this.patch = parts[2]!;
    this.build = parts[3]!;
  }

  public toStoreVersion(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  public toQuadVersion(): string {
    return `${this.major}.${this.minor}.${this.patch}.${this.build}`;
  }

  private parseParts(raw: string): number[] {
    const trimmed = (raw || "").trim();
    const tokens = trimmed.split(".");
    if (tokens.length < 2 || tokens.length > 4) {
      throw new ValidationError(`Invalid version format: "${raw}". Must be X.Y, X.Y.Z or X.Y.Z.W`, "AppVersion");
    }
    const numbers = tokens.map(t => this.parseToken(t));
    while (numbers.length < 4) {
      numbers.push(0);
    }
    return numbers;
  }

  private parseToken(token: string): number {
    const val = Number.parseInt(token, 10);
    if (Number.isNaN(val) || val < 0) {
      throw new ValidationError(`Invalid version number segment: "${token}".`, "AppVersion");
    }
    return val;
  }
}
