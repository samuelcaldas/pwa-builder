import { describe, it, expect } from "vitest";
import { PwaBuilderSDK } from "../../src/client.js";
import { MockHttpClient } from "../../src/core/http-client.js";

describe("PwaBuilderSDK Facade", () => {
  it("should initialize with default dependencies", () => {
    const sdk = new PwaBuilderSDK();
    expect(sdk.report).toBeDefined();
    expect(sdk.images).toBeDefined();
    expect(sdk.packaging.android).toBeDefined();
    expect(sdk.packaging.windows).toBeDefined();
    expect(sdk.packaging.ios).toBeDefined();
  });

  it("should accept injected mock HTTP client", () => {
    const mockHttp = new MockHttpClient();
    const sdk = new PwaBuilderSDK({ httpClient: mockHttp });
    expect(sdk.report).toBeDefined();
  });
});
