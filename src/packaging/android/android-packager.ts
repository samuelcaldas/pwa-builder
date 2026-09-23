import type { IHttpClient } from "../../core/types.js";
import { ValidationError, PackagingJobError, AnalysisTimeoutError } from "../../core/errors.js";
import { PackageArchive } from "../types.js";
import type { PwaAnalysisResult } from "../../report/types.js";
import type { AndroidPackageOptions, AndroidPollOptions } from "./types.js";
import { AndroidOptionsBuilder } from "./options-builder.js";

interface JobStatusPayload {
  readonly id: string;
  readonly status: "Completed" | "Failed" | "InProgress" | string;
  readonly logs?: readonly string[];
  readonly errors?: readonly string[];
}

/**
 * Packaging client for Google Play (Android TWA / CloudAPK) packages.
 */
export class AndroidPackager {
  private readonly http: IHttpClient;
  private readonly baseUrl: string;

  public constructor(http: IHttpClient, baseUrl = "https://pwabuilder-cloudapk.azurewebsites.net") {
    this.http = http;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  public async build(options: AndroidPackageOptions, pollOptions?: AndroidPollOptions): Promise<PackageArchive> {
    this.assertValidOptions(options);
    const jobId = await this.enqueue(options);
    await this.pollUntilComplete(jobId, pollOptions);
    return this.downloadPackage(jobId);
  }

  public async buildFromAnalysis(
    analysis: PwaAnalysisResult,
    overrides?: Partial<AndroidPackageOptions>,
    pollOptions?: AndroidPollOptions
  ): Promise<PackageArchive> {
    const options = this.createOptionsFromAnalysis(analysis, overrides);
    return this.build(options, pollOptions);
  }

  public createOptionsFromAnalysis(
    analysis: PwaAnalysisResult,
    overrides?: Partial<AndroidPackageOptions>
  ): AndroidPackageOptions {
    return AndroidOptionsBuilder.fromAnalysis(analysis, overrides);
  }

  private async enqueue(options: AndroidPackageOptions): Promise<string> {
    const payload = AndroidOptionsBuilder.normalize(options);
    const response = await this.http.request<string>({
      url: `${this.baseUrl}/enqueuePackageJob`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      responseType: "text"
    });
    return (response.data || "").trim().replace(/^"|"$/g, "");
  }

  private async pollUntilComplete(jobId: string, options?: AndroidPollOptions): Promise<void> {
    const timeout = options?.timeoutMs ?? 180000;
    const interval = options?.intervalMs ?? 3000;
    const startTime = Date.now();
    let attempt = 0;

    while (Date.now() - startTime < timeout) {
      attempt += 1;
      const statusData = await this.checkJobStatus(jobId);
      if (statusData.status === "Completed") {
        return;
      }
      this.assertNotFailed(statusData);
      options?.onProgress?.(attempt, statusData.status, statusData.logs);
      await this.sleep(interval);
    }
    throw new AnalysisTimeoutError(jobId, timeout);
  }

  private assertNotFailed(statusData: JobStatusPayload): void {
    if (statusData.status !== "Failed") {
      return;
    }
    const message = (statusData.errors || []).join("; ") || "Android packaging job failed in CloudAPK";
    throw new PackagingJobError("android", message, statusData.logs);
  }

  private async checkJobStatus(jobId: string): Promise<JobStatusPayload> {
    const response = await this.http.request<JobStatusPayload>({
      url: `${this.baseUrl}/getPackageJob?id=${encodeURIComponent(jobId)}`,
      method: "GET",
      responseType: "json"
    });
    return response.data;
  }

  private async downloadPackage(jobId: string): Promise<PackageArchive> {
    const response = await this.http.request<ArrayBuffer>({
      url: `${this.baseUrl}/downloadPackageZip?id=${encodeURIComponent(jobId)}`,
      method: "GET",
      responseType: "arraybuffer"
    });
    return new PackageArchive(response.data);
  }

  private assertValidOptions(options: AndroidPackageOptions): void {
    if (!options.packageId || !options.name || !options.iconUrl) {
      throw new ValidationError("Android options requires packageId, name, and iconUrl.", "AndroidPackageOptions");
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
