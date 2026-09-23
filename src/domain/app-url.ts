import { ValidationError } from "../core/errors.js";

/**
 * Value Object representing a validated HTTP/HTTPS Application URL.
 */
export class AppUrl {
  private readonly parsed: URL;

  public constructor(rawUrl: string) {
    this.parsed = this.validateAndParse(rawUrl);
  }

  public get origin(): string {
    return this.parsed.origin;
  }

  public get hostname(): string {
    return this.parsed.hostname;
  }

  public get pathname(): string {
    return this.parsed.pathname;
  }

  public resolve(relativeOrAbsolute: string): AppUrl {
    const resolved = new URL(relativeOrAbsolute, this.parsed);
    return new AppUrl(resolved.toString());
  }

  public toString(): string {
    return this.parsed.toString();
  }

  private validateAndParse(rawUrl: string): URL {
    const trimmed = (rawUrl || "").trim();
    if (!trimmed) {
      throw new ValidationError("Application URL cannot be empty.", "AppUrl");
    }
    const parsed = this.attemptParseUrl(trimmed);
    this.assertHttpScheme(parsed);
    return parsed;
  }

  private attemptParseUrl(value: string): URL {
    try {
      return new URL(value);
    } catch {
      throw new ValidationError(`Invalid URL format: "${value}".`, "AppUrl");
    }
  }

  private assertHttpScheme(url: URL): void {
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    if (isHttp) {
      return;
    }
    throw new ValidationError(`URL protocol must be http: or https:, received "${url.protocol}".`, "AppUrl");
  }
}
