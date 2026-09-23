/**
 * Root exception for all PWABuilder SDK errors.
 */
export class PwaBuilderError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "PwaBuilderError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when domain validation or input boundary check fails.
 */
export class ValidationError extends PwaBuilderError {
  public readonly field?: string;

  public constructor(message: string, field?: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

/**
 * Thrown when analysis job polling exceeds the configured timeout.
 */
export class AnalysisTimeoutError extends PwaBuilderError {
  public readonly jobId: string;
  public readonly elapsedMs: number;

  public constructor(jobId: string, elapsedMs: number) {
    super(`Analysis job "${jobId}" exceeded polling timeout after ${elapsedMs}ms.`);
    this.name = "AnalysisTimeoutError";
    this.jobId = jobId;
    this.elapsedMs = elapsedMs;
  }
}

/**
 * Thrown when an asynchronous app store packaging job fails.
 */
export class PackagingJobError extends PwaBuilderError {
  public readonly platform: string;
  public readonly logs: readonly string[];

  public constructor(platform: string, message: string, logs: readonly string[] = []) {
    super(`Packaging failed for platform "${platform}": ${message}`);
    this.name = "PackagingJobError";
    this.platform = platform;
    this.logs = Object.freeze([...logs]);
  }
}

/**
 * Thrown when an HTTP request fails or returns an unexpected non-2xx status code.
 */
export class NetworkError extends PwaBuilderError {
  public readonly statusCode: number;
  public readonly statusText: string;
  public readonly url: string;

  public constructor(statusCode: number, statusText: string, url: string) {
    super(`HTTP request to "${url}" failed with status ${statusCode} (${statusText}).`);
    this.name = "NetworkError";
    this.statusCode = statusCode;
    this.statusText = statusText;
    this.url = url;
  }
}
