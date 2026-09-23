/**
 * Supported target platforms for store image generation.
 */
export type StorePlatform = "android" | "ios" | "windows11";

/**
 * Request options for generating store images.
 */
export interface ImageGenerationOptions {
  readonly baseImage: Buffer | Uint8Array | Blob;
  readonly platforms: readonly StorePlatform[];
  readonly backgroundColor?: string;
  readonly padding?: number;
  readonly fileName?: string;
}
