import type { IHttpClient } from "./core/types.js";
import { FetchHttpClient } from "./core/http-client.js";
import { ReportClient } from "./report/report-client.js";
import { ImageGeneratorClient } from "./images/image-client.js";
import { AndroidPackager } from "./packaging/android/android-packager.js";
import { WindowsPackager } from "./packaging/windows/windows-packager.js";
import { IosPackager } from "./packaging/ios/ios-packager.js";

/**
 * Configuration options for initializing the PwaBuilderSDK.
 */
export interface PwaBuilderSdkOptions {
  readonly httpClient?: IHttpClient;
  readonly baseUrl?: string;
  readonly cloudApkUrl?: string;
  readonly windowsGeneratorUrl?: string;
}

/**
 * Main SDK Facade unifying all PWABuilder capabilities:
 * - Report Card & Site Audit
 * - App Image Generator
 * - Store Packaging Engine (Android, Windows, iOS)
 */
export class PwaBuilderSDK {
  public readonly report: ReportClient;
  public readonly images: ImageGeneratorClient;
  public readonly packaging: {
    readonly android: AndroidPackager;
    readonly windows: WindowsPackager;
    readonly ios: IosPackager;
  };

  public constructor(options?: PwaBuilderSdkOptions) {
    const http = options?.httpClient ?? new FetchHttpClient();
    const baseUrl = options?.baseUrl ?? "https://www.pwabuilder.com/api";
    const cloudApkUrl = options?.cloudApkUrl ?? "https://pwabuilder-cloudapk.azurewebsites.net";
    const winUrl = options?.windowsGeneratorUrl ?? "https://pwabuilder-windows-docker.azurewebsites.net/msix/generatezip";

    this.report = new ReportClient(http, baseUrl);
    this.images = new ImageGeneratorClient(http, baseUrl);
    this.packaging = {
      android: new AndroidPackager(http, cloudApkUrl),
      windows: new WindowsPackager(http, winUrl),
      ios: new IosPackager(http, `${baseUrl}/iospackage/create`)
    };
  }
}
