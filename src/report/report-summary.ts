import { CapabilitiesCollection } from "../domain/capabilities.js";
import type { PwaAnalysisResult } from "./types.js";

/**
 * High-level scorecard and markdown summary of a PWA analysis.
 */
export class ReportSummary {
  public readonly id: string;
  public readonly url: string;
  public readonly canPackage: boolean;
  public readonly totalCapabilities: number;
  public readonly passedCapabilities: number;
  public readonly failedCapabilities: number;
  public readonly scorePercentage: number;
  private readonly capabilities: CapabilitiesCollection;

  public constructor(analysis: PwaAnalysisResult) {
    this.id = analysis.id;
    this.url = analysis.url;
    this.canPackage = analysis.canPackage;
    this.capabilities = new CapabilitiesCollection(analysis.capabilities);
    this.totalCapabilities = analysis.capabilities.length;
    this.passedCapabilities = this.capabilities.getPassed().length;
    this.failedCapabilities = this.capabilities.getFailed().length;
    this.scorePercentage = this.capabilities.getScorePercentage();
  }

  public toMarkdown(): string {
    const lines: string[] = [
      `# PWABuilder Report Card: ${this.url}`,
      "",
      `* **Store Packaging Ready:** ${this.canPackage ? "✅ YES" : "❌ NO"}`,
      `* **Overall Score:** ${this.scorePercentage}%`,
      `* **Passed Checks:** ${this.passedCapabilities} / ${this.totalCapabilities}`,
      `* **Failed Checks:** ${this.failedCapabilities}`,
      "",
      "## Missing or Incomplete Checks",
      ...this.buildFailedChecksList()
    ];
    return lines.join("\n");
  }

  private buildFailedChecksList(): string[] {
    const failed = this.capabilities.getFailed();
    if (failed.length === 0) {
      return ["* No failing checks found! Excellent configuration."];
    }
    return failed.map(c => `* **[${c.level}] ${c.id}:** ${c.description}`);
  }
}
