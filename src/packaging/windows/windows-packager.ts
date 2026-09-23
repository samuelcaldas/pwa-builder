import type { IHttpClient } from "../../core/types.js";
import { ValidationError, PackagingJobError } from "../../core/errors.js";
import { AppUrl } from "../../domain/app-url.js";
import { ManifestIconCollection } from "../../domain/manifest-icons.js";
import { PackageArchive } from "../types.js";
import type { PwaAnalysisResult } from "../../report/types.js";
import type { WindowsPackageOptions } from "./types.js";

/**
 * Packaging client for Microsoft Store / Windows MSIX packages.
 */
export class WindowsPackager {
  private readonly http: IHttpClient;
  private readonly endpoint: string;

  public constructor(http: IHttpClient, endpoint = "https://pwabuilder-windows-docker.azurewebsites.net/msix/generatezip") {
    this.http = http;
    this.endpoint = endpoint;
  }

  public async build(options: WindowsPackageOptions): Promise<PackageArchive> {
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
      throw new PackagingJobError("windows", (error as Error).message);
    }
  }

  public async buildFromAnalysis(
    analysis: PwaAnalysisResult,
    overrides?: Partial<WindowsPackageOptions>
  ): Promise<PackageArchive> {
    const options = this.createOptionsFromAnalysis(analysis, overrides);
    return this.build(options);
  }

  private assertValidOptions(options: WindowsPackageOptions): void {
    if (!options.name || !options.packageId || !options.url) {
      throw new ValidationError("Windows packaging requires name, packageId, and url.", "WindowsPackageOptions");
    }
    if (!options.publisher?.displayName || !options.publisher?.commonName) {
      throw new ValidationError("Windows packaging requires valid publisher information.", "publisher");
    }
  }

  private createOptionsFromAnalysis(
    analysis: PwaAnalysisResult,
    overrides?: Partial<WindowsPackageOptions>
  ): WindowsPackageOptions {
    const manifest = analysis.webManifest?.manifest ?? {};
    const baseUrl = new AppUrl(analysis.url);
    const icons = new ManifestIconCollection(analysis.webManifest?.manifest.icons).resolveUrls(baseUrl);
    const largest = icons.getLargestSquareIcon(512) ?? icons.getLargestSquareIcon();
    const appName = (manifest.name as string) || (manifest.short_name as string) || "PWA App";
    const packageId = overrides?.packageId ?? `App.${appName.replace(/[^a-zA-Z0-9]/g, "")}`;

    return {
      name: overrides?.name ?? appName,
      packageId,
      url: overrides?.url ?? baseUrl.resolve(manifest.start_url as string ?? "/").toString(),
      version: overrides?.version ?? "1.0.1",
      allowSigning: overrides?.allowSigning ?? true,
      generateModernPackage: overrides?.generateModernPackage ?? true,
      manifestUrl: analysis.webManifest?.url ?? baseUrl.resolve("/manifest.json").toString(),
      manifest,
      images: {
        baseImage: largest?.src ?? "",
        backgroundColor: (manifest.background_color as string) ?? "transparent",
        padding: 0
      },
      publisher: overrides?.publisher ?? {
        displayName: appName,
        commonName: `CN=${packageId}`
      },
      classicPackage: {
        generate: true,
        version: "1.0.0",
        url: baseUrl.toString()
      },
      resourceLanguage: overrides?.resourceLanguage ?? "en-us"
    };
  }
}
