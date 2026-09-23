import { ValidationError } from "../core/errors.js";

/**
 * Value Object representing a validated CSS Hex Color.
 */
export class ColorHex {
  public readonly value: string;

  public constructor(rawColor: string) {
    this.value = this.validateAndNormalize(rawColor);
  }

  private validateAndNormalize(raw: string): string {
    const trimmed = (raw || "").trim().toLowerCase();
    if (trimmed === "transparent") {
      return "transparent";
    }
    this.assertHexFormat(trimmed);
    return this.expandShortHex(trimmed);
  }

  private assertHexFormat(color: string): void {
    const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color);
    if (isHex) {
      return;
    }
    throw new ValidationError(`Invalid hex color: "${color}". Expected #RGB, #RRGGBB, or transparent.`, "ColorHex");
  }

  private expandShortHex(hex: string): string {
    if (hex.length === 4) {
      const r = hex[1]!;
      const g = hex[2]!;
      const b = hex[3]!;
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    return hex;
  }
}
