import { describe, it, expect } from "vitest";
import { parseCliArgs, executeCliCommand } from "../../bin/cli-core.js";
import { MockHttpClient } from "../../src/core/http-client.js";

describe("CLI Core Logic", () => {
  it("should parse audit command with url", () => {
    const args = parseCliArgs(["audit", "https://example.com", "--format", "json"]);
    expect(args.command).toBe("audit");
    expect(args.url).toBe("https://example.com");
    expect(args.format).toBe("json");
  });

  it("should parse package command with platform and out dir", () => {
    const args = parseCliArgs([
      "package",
      "https://example.com",
      "--platform",
      "windows",
      "--out",
      "./dist/pwa"
    ]);
    expect(args.command).toBe("package");
    expect(args.platform).toBe("windows");
    expect(args.out).toBe("./dist/pwa");
  });

  it("should execute audit command with mock client", async () => {
    const mockHttp = new MockHttpClient();
    mockHttp.onPost("https://www.pwabuilder.com/api/analyses/enqueue?url=https%3A%2F%2Fexample.com%2F", {
      status: 200,
      statusText: "OK",
      data: '"job:1"'
    });
    mockHttp.onGet("https://www.pwabuilder.com/api/analyses?id=job%3A1", {
      status: 200,
      statusText: "OK",
      data: {
        id: "job:1",
        url: "https://example.com/",
        status: "Completed",
        canPackage: true,
        capabilities: [
          { id: "ServesHtml", level: "Required", category: "General", status: "Passed", description: "HTML" }
        ]
      }
    });

    const output = await executeCliCommand(
      { command: "audit", url: "https://example.com/", format: "markdown" },
      mockHttp
    );

    expect(output).toContain("PWABuilder Report Card");
    expect(output).toContain("Store Packaging Ready");
  });
});
