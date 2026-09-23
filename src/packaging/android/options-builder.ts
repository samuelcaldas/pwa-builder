import { AppUrl } from "../../domain/app-url.js";
import { PackageId } from "../../domain/package-id.js";
import { ManifestIconCollection } from "../../domain/manifest-icons.js";
import type { PwaAnalysisResult } from "../../report/types.js";
import type { AndroidPackageOptions, AndroidSigningConfig } from "./types.js";

/**
 * Builds and normalizes Android package options adhering to CloudAPK requirements.
 */
export class AndroidOptionsBuilder {
  public static fromAnalysis(
    analysis: PwaAnalysisResult,
    overrides?: Partial<AndroidPackageOptions>
  ): AndroidPackageOptions {
    const manifest = analysis.webManifest?.manifest ?? {};
    const baseUrl = new AppUrl(analysis.url);
    const icons = new ManifestIconCollection(analysis.webManifest?.manifest.icons).resolveUrls(baseUrl);
    const largest = icons.getLargestSquareIcon(512) ?? icons.getLargestSquareIcon();
    const maskable = icons.getMaskableIcon();
    const appName = overrides?.name ?? this.resolveAppName(manifest);
    const themeColor = overrides?.themeColor ?? (manifest.theme_color as string) ?? "#000000";
    const themeColorDark = overrides?.themeColorDark ?? "#000000";
    const signingMode = this.resolveSigningMode(overrides);

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
      name: appName,
      launcherName: overrides?.launcherName ?? this.resolveLauncherName(manifest, appName),
      packageId: overrides?.packageId ?? PackageId.fromHostname(baseUrl.hostname).value,
      startUrl: overrides?.startUrl ?? (manifest.start_url as string ?? "/"),
      themeColor,
      themeColorDark,
      navigationColor: overrides?.navigationColor ?? themeColor,
      navigationColorDark: overrides?.navigationColorDark ?? themeColorDark,
      navigationDividerColor: overrides?.navigationDividerColor ?? "#000000",
      navigationDividerColorDark: overrides?.navigationDividerColorDark ?? "#000000",
      splashScreenFadeOutDuration: overrides?.splashScreenFadeOutDuration ?? 300,
      signingMode,
      signing: this.resolveSigning(signingMode, appName, overrides?.signing),
      webManifestUrl: analysis.webManifest?.url ?? baseUrl.resolve("/manifest.json").toString(),
      pwaUrl: analysis.url,
      fullScopeUrl: baseUrl.resolve("/").toString(),
      minSdkVersion: overrides?.minSdkVersion ?? 23
    };
  }

  public static normalize(options: AndroidPackageOptions): Record<string, unknown> {
    const signingMode = this.resolveSigningMode(options);
    const signing = this.resolveSigning(signingMode, options.name, options.signing);
    const themeColor = options.themeColor ?? "#000000";
    const themeColorDark = options.themeColorDark ?? "#000000";

    return {
      ...options,
      themeColor,
      themeColorDark,
      navigationColor: options.navigationColor ?? themeColor,
      navigationColorDark: options.navigationColorDark ?? themeColorDark,
      navigationDividerColor: options.navigationDividerColor ?? "#000000",
      navigationDividerColorDark: options.navigationDividerColorDark ?? "#000000",
      splashScreenFadeOutDuration: options.splashScreenFadeOutDuration ?? 300,
      signingMode,
      signing
    };
  }

  private static resolveAppName(manifest: Record<string, unknown>): string {
    const name = (manifest.name as string) || (manifest.short_name as string);
    if (name) {
      return name;
    }
    return "My App";
  }

  private static resolveLauncherName(manifest: Record<string, unknown>, appName: string): string {
    const shortName = manifest.short_name as string;
    if (shortName) {
      return shortName.substring(0, 12);
    }
    return appName.substring(0, 12);
  }

  private static resolveSigningMode(options?: Partial<AndroidPackageOptions>): "new" | "existing" | "none" {
    if (options?.signingMode) {
      return options.signingMode;
    }
    if (options?.signing?.file) {
      return "existing";
    }
    return "new";
  }

  private static resolveSigning(
    mode: "new" | "existing" | "none",
    appName: string,
    existingSigning?: AndroidSigningConfig | null
  ): AndroidSigningConfig | null {
    if (mode === "none") {
      return null;
    }
    if (existingSigning) {
      return existingSigning;
    }
    return this.createDefaultSigning(appName);
  }

  private static createDefaultSigning(appName: string): AndroidSigningConfig {
    const keyAlias = appName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "releasekey";
    return {
      file: null,
      alias: keyAlias,
      fullName: appName,
      organization: appName,
      organizationalUnit: "Defesa Civil",
      countryCode: "BR",
      keyPassword: "signing_password",
      storePassword: "signing_password"
    };
  }
}
