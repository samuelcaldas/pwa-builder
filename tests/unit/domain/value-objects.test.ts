import { describe, it, expect } from "vitest";
import { AppUrl } from "../../../src/domain/app-url.js";
import { PackageId } from "../../../src/domain/package-id.js";
import { AppVersion } from "../../../src/domain/app-version.js";
import { ColorHex } from "../../../src/domain/color-hex.js";
import { ValidationError } from "../../../src/core/errors.js";

describe("Domain Value Objects", () => {
  describe("AppUrl", () => {
    it("should accept valid https url", () => {
      const url = new AppUrl("https://example.com/dashboard");
      expect(url.toString()).toBe("https://example.com/dashboard");
      expect(url.origin).toBe("https://example.com");
      expect(url.hostname).toBe("example.com");
    });

    it("should normalize url by trimming whitespace", () => {
      const url = new AppUrl("  https://example.com/  ");
      expect(url.origin).toBe("https://example.com");
    });

    it("should throw ValidationError on invalid url format", () => {
      expect(() => new AppUrl("not-a-url")).toThrow(ValidationError);
      expect(() => new AppUrl("")).toThrow(ValidationError);
      expect(() => new AppUrl("ftp://invalid.scheme")).toThrow(ValidationError);
    });

    it("should allow resolving relative paths", () => {
      const base = new AppUrl("https://example.com");
      const resolved = base.resolve("/manifest.json");
      expect(resolved.toString()).toBe("https://example.com/manifest.json");
    });
  });

  describe("PackageId", () => {
    it("should accept valid package ids for android and windows", () => {
      const androidPkg = new PackageId("com.example.app.twa");
      expect(androidPkg.value).toBe("com.example.app.twa");

      const winPkg = new PackageId("ExampleCorp.App");
      expect(winPkg.value).toBe("ExampleCorp.App");
    });

    it("should throw ValidationError when package id has invalid characters", () => {
      expect(() => new PackageId("invalid package with spaces")).toThrow(ValidationError);
      expect(() => new PackageId("invalid@package")).toThrow(ValidationError);
      expect(() => new PackageId("")).toThrow(ValidationError);
    });

    it("should throw ValidationError when package id lacks dots or has consecutive dots", () => {
      expect(() => new PackageId("nodots")).toThrow(ValidationError);
      expect(() => new PackageId("consecutive..dots")).toThrow(ValidationError);
      expect(() => new PackageId(".starts.with.dot")).toThrow(ValidationError);
      expect(() => new PackageId("ends.with.dot.")).toThrow(ValidationError);
    });

    it("should create default Android package id from hostname", () => {
      const generated = PackageId.fromHostname("app.example.com");
      expect(generated.value).toBe("com.example.app.twa");
    });
  });

  describe("AppVersion", () => {
    it("should parse 3-part or 4-part semantic version", () => {
      const v3 = new AppVersion("1.0.1");
      expect(v3.toStoreVersion()).toBe("1.0.1");
      expect(v3.toQuadVersion()).toBe("1.0.1.0");

      const v4 = new AppVersion("1.0.0.5");
      expect(v4.toStoreVersion()).toBe("1.0.0");
      expect(v4.toQuadVersion()).toBe("1.0.0.5");
    });

    it("should throw ValidationError on malformed versions", () => {
      expect(() => new AppVersion("alpha")).toThrow(ValidationError);
      expect(() => new AppVersion("1")).toThrow(ValidationError);
      expect(() => new AppVersion("")).toThrow(ValidationError);
    });
  });

  describe("ColorHex", () => {
    it("should accept and normalize valid hex colors", () => {
      expect(new ColorHex("#FFF").value).toBe("#ffffff");
      expect(new ColorHex("#000000").value).toBe("#000000");
      expect(new ColorHex("transparent").value).toBe("transparent");
    });

    it("should throw ValidationError on invalid color string", () => {
      expect(() => new ColorHex("red")).toThrow(ValidationError);
      expect(() => new ColorHex("#12")).toThrow(ValidationError);
      expect(() => new ColorHex("")).toThrow(ValidationError);
    });
  });
});
