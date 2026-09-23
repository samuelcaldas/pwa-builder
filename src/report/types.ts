import type { Capability } from "../domain/capabilities.js";
import type { ManifestIcon } from "../domain/manifest-icons.js";

/**
 * Parsed web app manifest payload.
 */
export interface WebManifestData {
  readonly url?: string;
  readonly manifest: {
    readonly name?: string;
    readonly short_name?: string;
    readonly description?: string;
    readonly start_url?: string;
    readonly display?: string;
    readonly background_color?: string;
    readonly theme_color?: string;
    readonly icons?: readonly ManifestIcon[];
    readonly shortcuts?: readonly unknown[];
    readonly screenshots?: readonly unknown[];
    readonly [key: string]: unknown;
  };
  readonly manifestRaw?: string;
  readonly appIcon?: string;
  readonly hasBase64EncodedImages?: boolean;
}

/**
 * Complete analysis result returned by the PWABuilder Report Card API.
 */
export interface PwaAnalysisResult {
  readonly id: string;
  readonly url: string;
  readonly status: "Processing" | "Completed" | "Failed" | string;
  readonly canPackage: boolean;
  readonly webManifest?: WebManifestData;
  readonly capabilities: readonly Capability[];
  readonly logs?: readonly string[];
  readonly createdAt?: string;
  readonly lastModifiedAt?: string;
}

/**
 * Options for controlling analysis polling behavior.
 */
export interface AnalysisPollOptions {
  readonly intervalMs?: number;
  readonly timeoutMs?: number;
  readonly onProgress?: (attempt: number, status: string) => void;
}
