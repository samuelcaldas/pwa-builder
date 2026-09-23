/**
 * Options for generating iOS Xcode / Swift WebKit wrapper packages.
 */
export interface IosPackageOptions {
  readonly name: string;
  readonly bundleId: string;
  readonly url: string;
  readonly imageUrl: string;
  readonly splashColor: string;
  readonly progressBarColor: string;
  readonly statusBarColor: string;
  readonly permittedUrls?: readonly string[];
  readonly manifestUrl: string;
  readonly manifest: Record<string, unknown>;
}
