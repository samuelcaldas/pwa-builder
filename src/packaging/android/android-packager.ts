import type { IHttpClient } from "../../core/types.js";
import { ValidationError, PackagingJobError, AnalysisTimeoutError } from "../../core/errors.js";
import { AppUrl } from "../../domain/app-url.js";
import { PackageId } from "../../domain/package-id.js";
import { ManifestIconCollection } from "../../domain/manifest-icons.js";
import { PackageArchive } from "../types.js";
import type { PwaAnalysisResult } from "../../report/types.js";
import type { AndroidPackageOptions, AndroidPollOptions } from "./types.js";

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

  private async enqueue(options: AndroidPackageOptions): Promise<string> {
    const response = await this.http.request<string>({
      url: `${this.baseUrl}/enqueuePackageJob`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
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
      if (statusData.status === "Failed") {
        const message = (statusData.errors || []).join("; ") || "Android packaging job failed in CloudAPK";
        throw new PackagingJobError("android", message, statusData.logs);
      }
      options?.onProgress?.(attempt, statusData.status, statusData.logs);
      await this.sleep(interval);
    }
    throw new AnalysisTimeoutError(jobId, timeout);
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

  private createOptionsFromAnalysis(
    analysis: PwaAnalysisResult,
    overrides?: Partial<AndroidPackageOptions>
  ): AndroidPackageOptions {
    const manifest = analysis.webManifest?.manifest ?? {};
    const baseUrl = new AppUrl(analysis.url);
    const icons = new ManifestIconCollection(analysis.webManifest?.manifest.icons).resolveUrls(baseUrl);
    const largest = icons.getLargestSquareIcon(512) ?? icons.getLargestSquareIcon();
    const maskable = icons.getMaskableIcon();
    const appName = (manifest.name as string) || (manifest.short_name as string) || "My App";
    const packageId = overrides?.packageId ?? PackageId.fromHostname(baseUrl.hostname).value;

    return {
      appVersion: overrides?.appVersion ?? "1.0.0.0",
      appVersionCode: overrides?.appVersionCode ?? 1,
      backgroundColor: overrides?.backgroundColor ?? (manifest.background_color as string) ?? "#ffffff",
      display: overrides?.display ?? (manifest.display as string) ?? "standalone",
      enableNotifications: overrides?.enableNotifications ?? true,
      enableSiteSettingsShortcut: overrides?.enableSiteSettingsShortcut ?? true,
      fallbackType: overrides?.fallbackType ?? "customtabs",
      features: overrides?.features ?? { locationDelegation: { enabled: false }, playBilling: { enabled: false } },
      host: baseUrl.hostname,
      iconUrl: overrides?.iconUrl ?? largest?.src ?? "",
      maskableIconUrl: overrides?.maskableIconUrl ?? maskable?.src,
      name: overrides?.name ?? appName,
      launcherName: overrides?.launcherName ?? (manifest.short_name as string) ?? appName.substring(0, 12),
      packageId,
      startUrl: overrides?.startUrl ?? (manifest.start_url as string ?? "/dashboard"),
      themeColor: overrides?.themeColor ?? (manifest.theme_color as string) ?? "#000000",
      themeColorDark: overrides?.themeColorDark ?? "#000000",
      webManifestUrl: analysis.webManifest?.url ?? baseUrl.resolve("/manifest.json").toString(),
      pwaUrl: analysis.url,
      fullScopeUrl: baseUrl.resolve("/").toString(),
      minSdkVersion: overrides?.minSdkVersion ?? 23
    };
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
