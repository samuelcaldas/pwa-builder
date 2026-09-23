import { ValidationError } from "../core/errors.js";

/**
 * Value Object representing a validated platform Application Package ID.
 */
export class PackageId {
  public readonly value: string;

  public constructor(rawId: string) {
    this.value = this.validateAndNormalize(rawId);
  }

  public static fromHostname(hostname: string): PackageId {
    const segments = hostname
      .split(".")
      .reverse()
      .map(part => part.trim().toLowerCase().replace(/[^a-zA-Z0-9_]/g, "_"))
      .filter(part => part.length > 0);
    segments.push("twa");
    return new PackageId(segments.join("."));
  }

  private validateAndNormalize(rawId: string): string {
    const trimmed = (rawId || "").trim();
    if (!trimmed) {
      throw new ValidationError("Package ID cannot be empty.", "PackageId");
    }
    this.assertAllowedCharacters(trimmed);
    this.assertDotRules(trimmed);
    return trimmed;
  }

  private assertAllowedCharacters(value: string): void {
    const invalidCharMatch = /[^a-zA-Z0-9_.-]/.test(value);
    if (!invalidCharMatch) {
      return;
    }
    throw new ValidationError(`Package ID contains invalid characters: "${value}".`, "PackageId");
  }

  private assertDotRules(value: string): void {
    const hasDot = value.includes(".");
    const hasConsecutiveDots = value.includes("..");
    const startsOrEndsWithDot = value.startsWith(".") || value.endsWith(".");
    if (hasDot && !hasConsecutiveDots && !startsOrEndsWithDot) {
      return;
    }
    throw new ValidationError(`Package ID must contain dot-separated segments: "${value}".`, "PackageId");
  }
}
