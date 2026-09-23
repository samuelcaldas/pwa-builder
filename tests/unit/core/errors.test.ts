import { describe, it, expect } from "vitest";
import {
  PwaBuilderError,
  ValidationError,
  AnalysisTimeoutError,
  PackagingJobError,
  NetworkError
} from "../../../src/core/errors.js";

describe("Core Errors Hierarchy", () => {
  it("should instantiate PwaBuilderError with message", () => {
    const error = new PwaBuilderError("Base error occurred");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PwaBuilderError);
    expect(error.name).toBe("PwaBuilderError");
    expect(error.message).toBe("Base error occurred");
  });

  it("should instantiate ValidationError with field context", () => {
    const error = new ValidationError("Invalid URL format", "appUrl");
    expect(error).toBeInstanceOf(PwaBuilderError);
    expect(error.name).toBe("ValidationError");
    expect(error.field).toBe("appUrl");
    expect(error.message).toBe("Invalid URL format");
  });

  it("should instantiate AnalysisTimeoutError with jobId and elapsed time", () => {
    const error = new AnalysisTimeoutError("job:123", 45000);
    expect(error).toBeInstanceOf(PwaBuilderError);
    expect(error.name).toBe("AnalysisTimeoutError");
    expect(error.jobId).toBe("job:123");
    expect(error.elapsedMs).toBe(45000);
    expect(error.message).toContain("job:123");
    expect(error.message).toContain("45000ms");
  });

  it("should instantiate PackagingJobError with platform and log traces", () => {
    const logs = ["Step 1: starting", "Step 2: failed compile"];
    const error = new PackagingJobError("android", "Build failed", logs);
    expect(error).toBeInstanceOf(PwaBuilderError);
    expect(error.name).toBe("PackagingJobError");
    expect(error.platform).toBe("android");
    expect(error.logs).toEqual(logs);
    expect(error.message).toContain("Build failed");
  });

  it("should instantiate NetworkError with statusCode and statusText", () => {
    const error = new NetworkError(500, "Internal Server Error", "https://api.test/endpoint");
    expect(error).toBeInstanceOf(PwaBuilderError);
    expect(error.name).toBe("NetworkError");
    expect(error.statusCode).toBe(500);
    expect(error.statusText).toBe("Internal Server Error");
    expect(error.url).toBe("https://api.test/endpoint");
  });
});
