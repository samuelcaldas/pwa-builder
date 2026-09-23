/**
 * Windows package publisher credentials.
 */
export interface WindowsPublisherInfo {
  readonly displayName: string;
  readonly commonName: string;
}

/**
 * Visual asset configuration for Windows MSIX.
 */
export interface WindowsImageOptions {
  readonly baseImage: string;
  readonly backgroundColor?: string;
  readonly padding?: number;
}

/**
 * Classic package metadata for Windows.
 */
export interface WindowsClassicPackageOptions {
  readonly generate: boolean;
  readonly version: string;
  readonly url: string;
}

/**
 * Options for generating Windows MSIX packages.
 */
export interface WindowsPackageOptions {
  readonly name: string;
  readonly packageId: string;
  readonly url: string;
  readonly version: string;
  readonly publisher: WindowsPublisherInfo;
  readonly manifestUrl: string;
  readonly manifest: Record<string, unknown>;
  readonly images: WindowsImageOptions;
  readonly resourceLanguage?: string;
  readonly classicPackage?: WindowsClassicPackageOptions;
  readonly allowSigning?: boolean;
  readonly generateModernPackage?: boolean;
  readonly enableWebAppWidgets?: boolean;
}
