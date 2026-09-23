import { describe, it, expect } from "vitest";
import { ReportClient } from "../../../src/report/report-client.js";
import { MockHttpClient } from "../../../src/core/http-client.js";
import { AnalysisTimeoutError } from "../../../src/core/errors.js";
import type { PwaAnalysisResult } from "../../../src/report/types.js";

describe("ReportClient", () => {
  const mockCompletedAnalysis: PwaAnalysisResult = {
    id: "analysis:example.com:123",
    url: "https://example.com/",
    status: "Completed",
    canPackage: true,
    webManifest: {
      url: "https://example.com/manifest.json",
      manifest: {
        name: "Example App",
        short_name: "App",
        start_url: "/dashboard",
        icons: [
          { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    },
    logs: ["Fetched manifest"],
    capabilities: [
      { id: "ServesHtml", level: "Required", category: "General", status: "Passed", description: "HTML" },
      { id: "HasHttps", level: "Required", category: "Https", status: "Passed", description: "HTTPS" },
      { id: "HasManifest", level: "Required", category: "WebAppManifest", status: "Passed", description: "Manifest" }
    ]
  };

  it("should enqueue analysis and return job ID", async () => {
    const mockHttp = new MockHttpClient();
    mockHttp.onPost("https://www.pwabuilder.com/api/analyses/enqueue?url=https%3A%2F%2Fexample.com%2F", {
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      data: '"analysis:example.com:123"'
    });

    const client = new ReportClient(mockHttp);
    const jobId = await client.enqueue("https://example.com/");
    expect(jobId).toBe("analysis:example.com:123");
  });

  it("should poll analysis until completion", async () => {
    const mockHttp = new MockHttpClient();
    mockHttp.onPost("https://www.pwabuilder.com/api/analyses/enqueue?url=https%3A%2F%2Fexample.com%2F", {
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      data: '"analysis:example.com:123"'
    });
    mockHttp.onGet("https://www.pwabuilder.com/api/analyses?id=analysis%3Aexample.com%3A123", {
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      data: mockCompletedAnalysis
    });

    const client = new ReportClient(mockHttp);
    const result = await client.analyze("https://example.com/", {
      intervalMs: 10,
      timeoutMs: 1000
    });

    expect(result.id).toBe("analysis:example.com:123");
    expect(result.canPackage).toBe(true);
    expect(result.status).toBe("Completed");
  });

  it("should throw AnalysisTimeoutError when polling exceeds timeout", async () => {
    const mockHttp = new MockHttpClient();
    mockHttp.onPost("https://www.pwabuilder.com/api/analyses/enqueue?url=https%3A%2F%2Fslow.test%2F", {
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      data: '"job:slow"'
    });
    mockHttp.onGet("https://www.pwabuilder.com/api/analyses?id=job%3Aslow", {
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      data: { ...mockCompletedAnalysis, id: "job:slow", status: "Processing" }
    });

    const client = new ReportClient(mockHttp);
    await expect(
      client.analyze("https://slow.test/", {
        intervalMs: 20,
        timeoutMs: 50
      })
    ).rejects.toThrow(AnalysisTimeoutError);
  });

  it("should generate structured summary markdown and scorecard", async () => {
    const mockHttp = new MockHttpClient();
    const client = new ReportClient(mockHttp);
    const summary = client.summarize(mockCompletedAnalysis);

    expect(summary.totalCapabilities).toBe(3);
    expect(summary.passedCapabilities).toBe(3);
    expect(summary.canPackage).toBe(true);
    expect(summary.scorePercentage).toBe(100);
    expect(summary.toMarkdown()).toContain("PWABuilder Report Card");
  });
});
