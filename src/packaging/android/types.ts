/**
 * Android signing credentials configuration.
 */
export interface AndroidSigningConfig {
  readonly file?: string | null;
  readonly alias?: string;
  readonly fullName?: string;
  readonly organization?: string;
  readonly organizationalUnit?: string;
  readonly countryCode?: string;
  readonly keyPassword?: string;
  readonly storePassword?: string;
}

/**
 * Options for generating Android TWA (Trusted Web Activity) packages via CloudAPK.
 */
export interface AndroidPackageOptions {
  readonly appVersion: string;
  readonly appVersionCode: number;
  readonly backgroundColor: string;
  readonly display: "standalone" | "fullscreen" | "minimal-ui" | string;
  readonly enableNotifications: boolean;
  readonly enableSiteSettingsShortcut: boolean;
  readonly fallbackType: "customtabs" | "webview" | string;
  readonly features: {
    readonly locationDelegation: { readonly enabled: boolean };
    readonly playBilling: { readonly enabled: boolean };
  };
  readonly host: string;
  readonly iconUrl: string;
  readonly maskableIconUrl?: string;
  readonly monochromeIconUrl?: string;
  readonly name: string;
  readonly launcherName: string;
  readonly packageId: string;
  readonly shortcuts?: readonly unknown[];
  readonly signing?: AndroidSigningConfig | null;
  readonly signingMode?: "new" | "existing" | "none";
  readonly splashScreenFadeOutDuration?: number;
  readonly startUrl: string;
  readonly themeColor: string;
  readonly themeColorDark?: string;
  readonly navigationColor?: string;
  readonly navigationColorDark?: string;
  readonly navigationDividerColor?: string;
  readonly navigationDividerColorDark?: string;
  readonly webManifestUrl: string;
  readonly pwaUrl: string;
  readonly fullScopeUrl?: string;
  readonly minSdkVersion?: number;
}

/**
 * Polling configuration for CloudAPK packaging jobs.
 */
export interface AndroidPollOptions {
  readonly intervalMs?: number;
  readonly timeoutMs?: number;
  readonly onProgress?: (attempt: number, status: string, logs?: readonly string[]) => void;
}
