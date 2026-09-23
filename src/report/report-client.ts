import type { IHttpClient } from "../core/types.js";
import { AppUrl } from "../domain/app-url.js";
import { AnalysisTimeoutError, ValidationError } from "../core/errors.js";
import { ReportSummary } from "./report-summary.js";
import type { PwaAnalysisResult, AnalysisPollOptions } from "./types.js";

/**
 * Client for enqueuing and polling PWABuilder site analyses.
 */
export class ReportClient {
  private readonly http: IHttpClient;
  private readonly baseUrl: string;

  public constructor(http: IHttpClient, baseUrl = "https://www.pwabuilder.com/api") {
    this.http = http;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  public async enqueue(targetUrl: AppUrl | string): Promise<string> {
    const validUrl = this.normalizeUrl(targetUrl);
    const endpoint = `${this.baseUrl}/analyses/enqueue?url=${encodeURIComponent(validUrl.toString())}`;
    const response = await this.http.request<string>({
      url: endpoint,
      method: "POST",
      responseType: "text"
    });
    const jobId = (response.data || "").trim().replace(/^"|"$/g, "");
    if (!jobId) {
      throw new ValidationError("Failed to retrieve valid analysis Job ID from server.", "ReportClient");
    }
    return jobId;
  }

  public async fetchStatus(jobId: string): Promise<PwaAnalysisResult | null> {
    const endpoint = `${this.baseUrl}/analyses?id=${encodeURIComponent(jobId)}`;
    const response = await this.http.request<PwaAnalysisResult | null>({
      url: endpoint,
      method: "GET",
      responseType: "json"
    });
    if (response.status === 204 || !response.data) {
      return null;
    }
    return response.data;
  }

  public async analyze(targetUrl: AppUrl | string, options?: AnalysisPollOptions): Promise<PwaAnalysisResult> {
    const jobId = await this.enqueue(targetUrl);
    const interval = options?.intervalMs ?? 2000;
    const timeout = options?.timeoutMs ?? 60000;
    const startTime = Date.now();
    let attempt = 0;

    while (Date.now() - startTime < timeout) {
      attempt += 1;
      const result = await this.fetchStatus(jobId);
      if (result && this.isTerminalStatus(result.status)) {
        return result;
      }
      options?.onProgress?.(attempt, result?.status ?? "Waiting");
      await this.sleep(interval);
    }
    throw new AnalysisTimeoutError(jobId, timeout);
  }

  public summarize(analysis: PwaAnalysisResult): ReportSummary {
    return new ReportSummary(analysis);
  }

  private isTerminalStatus(status: string): boolean {
    return status === "Completed" || status === "Failed";
  }

  private normalizeUrl(targetUrl: AppUrl | string): AppUrl {
    return typeof targetUrl === "string" ? new AppUrl(targetUrl) : targetUrl;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
