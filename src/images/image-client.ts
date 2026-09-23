import type { IHttpClient } from "../core/types.js";
import { ValidationError } from "../core/errors.js";
import { ColorHex } from "../domain/color-hex.js";
import { ImageArchive } from "./image-archive.js";
import type { ImageGenerationOptions } from "./types.js";

/**
 * Client for generating store-ready PWA image packages via PWABuilder App Image Generator.
 */
export class ImageGeneratorClient {
  private readonly http: IHttpClient;
  private readonly baseUrl: string;

  public constructor(http: IHttpClient, baseUrl = "https://www.pwabuilder.com/api") {
    this.http = http;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  public async generate(options: ImageGenerationOptions): Promise<ImageArchive> {
    this.assertValidOptions(options);
    const formData = this.buildFormData(options);
    const endpoint = `${this.baseUrl}/images/generateStoreImages`;

    const response = await this.http.request<ArrayBuffer>({
      url: endpoint,
      method: "POST",
      body: formData,
      responseType: "arraybuffer"
    });

    return new ImageArchive(response.data);
  }

  private assertValidOptions(options: ImageGenerationOptions): void {
    if (!options.baseImage) {
      throw new ValidationError("Base image data is required for generation.", "baseImage");
    }
    if (!options.platforms || options.platforms.length === 0) {
      throw new ValidationError("At least one target platform must be specified.", "platforms");
    }
  }

  private buildFormData(options: ImageGenerationOptions): FormData {
    const form = new FormData();
    const blob = this.toBlob(options.baseImage);
    const fileName = options.fileName ?? "icon-512x512.png";
    form.append("baseImage", blob, fileName);

    const padding = String(options.padding ?? 0);
    const bgColor = new ColorHex(options.backgroundColor ?? "#ffffff").value;
    form.append("padding", padding);
    form.append("backgroundColor", bgColor);

    for (const platform of options.platforms) {
      form.append("platforms", platform);
    }
    return form;
  }

  private toBlob(data: Buffer | Uint8Array | Blob): Blob {
    if (data instanceof Blob) {
      return data;
    }
    return new Blob([data as unknown as BlobPart], { type: "image/png" });
  }
}
