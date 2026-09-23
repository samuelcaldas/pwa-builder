/**
 * PWA capability item evaluated by PWABuilder Report Card.
 */
export interface Capability {
  readonly id: string;
  readonly level: "Required" | "Recommended" | "Feature" | "Optional";
  readonly category: "General" | "WebAppManifest" | "ServiceWorker" | "Https";
  readonly status: "Passed" | "Failed" | "Skipped" | "Warning";
  readonly description: string;
  readonly todoAction?: string;
  readonly learnMoreUrl?: string;
}

/**
 * First-class collection wrapping and querying evaluated report card capabilities.
 */
export class CapabilitiesCollection {
  private readonly items: readonly Capability[];

  public constructor(items?: readonly Capability[]) {
    this.items = Object.freeze([...(items ?? [])]);
  }

  public all(): readonly Capability[] {
    return this.items;
  }

  public getPassed(): readonly Capability[] {
    return this.items.filter(c => c.status === "Passed");
  }

  public getFailed(): readonly Capability[] {
    return this.items.filter(c => c.status === "Failed");
  }

  public getSkipped(): readonly Capability[] {
    return this.items.filter(c => c.status === "Skipped");
  }

  public findMissingRequired(): readonly Capability[] {
    return this.items.filter(c => c.level === "Required" && c.status !== "Passed");
  }

  public isStoreReady(): boolean {
    return this.findMissingRequired().length === 0;
  }

  public getScorePercentage(): number {
    const evaluated = this.items.filter(c => c.status !== "Skipped");
    if (evaluated.length === 0) {
      return 0;
    }
    const passed = this.getPassed().length;
    return Math.round((passed / evaluated.length) * 100);
  }
}
