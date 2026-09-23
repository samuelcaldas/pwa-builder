import type { IHttpClient } from "../../core/types.js";
import { ValidationError, PackagingJobError } from "../../core/errors.js";
import { AppUrl } from "../../domain/app-url.js";
import { PackageId } from "../../domain/package-id.js";
import { ManifestIconCollection } from "../../domain/manifest-icons.js";
import { PackageArchive } from "../types.js";
import type { PwaAnalysisResult } from "../../report/types.js";
import type { IosPackageOptions } from "./types.js";

/**
 * Packaging client for Apple App Store (iOS) Xcode projects.
 */
export class IosPackager {
  private readonly http: IHttpClient;
  private readonly endpoint: string;

  public constructor(http: IHttpClient, endpoint = "https://www.pwabuilder.com/api/iospackage/create") {
    this.http = http;
    this.endpoint = endpoint;
  }

  public async build(options: IosPackageOptions): Promise<PackageArchive> {
    this.assertValidOptions(options);
    try {
      const response = await this.http.request<ArrayBuffer>({
        url: this.endpoint,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
        responseType: "arraybuffer"
      });
      return new PackageArchive(response.data);
    } catch (error) {
      throw new PackagingJobError("ios", (error as Error).message);
    }
  }

  public async buildFromAnalysis(
    analysis: PwaAnalysisResult,
    overrides?: Partial<IosPackageOptions>
  ): Promise<PackageArchive> {
    const options = this.createOptionsFromAnalysis(analysis, overrides);
    return this.build(options);
  }

  private assertValidOptions(options: IosPackageOptions): void {
    if (!options.name || options.name.length < 3) {
      throw new ValidationError("iOS name must be at least 3 characters long.", "name");
    }
    if (!options.bundleId || options.bundleId.length < 3) {
      throw new ValidationError("iOS bundleId must be at least 3 characters long.", "bundleId");
    }
    if (!options.imageUrl || !options.url) {
      throw new ValidationError("iOS packaging requires imageUrl and url.", "IosPackageOptions");
    }
  }

  private createOptionsFromAnalysis(
    analysis: PwaAnalysisResult,
    overrides?: Partial<IosPackageOptions>
  ): IosPackageOptions {
    const manifest = analysis.webManifest?.manifest ?? {};
    const baseUrl = new AppUrl(analysis.url);
    const icons = new ManifestIconCollection(analysis.webManifest?.manifest.icons).resolveUrls(baseUrl);
    const largest = icons.getLargestSquareIcon(512) ?? icons.getLargestSquareIcon();
    const appName = (manifest.name as string) || (manifest.short_name as string) || "My App";
    const defaultBundleId = PackageId.fromHostname(baseUrl.hostname).value.replace(/\.twa$/, "");

    return {
      name: overrides?.name ?? appName,
      bundleId: overrides?.bundleId ?? defaultBundleId,
      url: overrides?.url ?? baseUrl.resolve(manifest.start_url as string ?? "/").toString(),
      imageUrl: overrides?.imageUrl ?? largest?.src ?? "",
      splashColor: overrides?.splashColor ?? (manifest.background_color as string) ?? "#ffffff",
      progressBarColor: overrides?.progressBarColor ?? (manifest.theme_color as string) ?? "#000000",
      statusBarColor: overrides?.statusBarColor ?? (manifest.theme_color as string) ?? "#ffffff",
      permittedUrls: overrides?.permittedUrls ?? [],
      manifestUrl: analysis.webManifest?.url ?? baseUrl.resolve("/manifest.json").toString(),
      manifest
    };
  }
}
