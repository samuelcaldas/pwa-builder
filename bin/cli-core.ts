import { parseArgs } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { PwaBuilderSDK } from "../src/client.js";
import type { IHttpClient } from "../src/core/types.js";
import type { StorePlatform } from "../src/images/types.js";
import { ValidationError } from "../src/core/errors.js";

export interface CliParsedOptions {
  readonly command: "audit" | "assets" | "package" | "help";
  readonly url?: string;
  readonly image?: string;
  readonly platform?: "android" | "windows" | "ios" | "all";
  readonly platforms?: readonly StorePlatform[];
  readonly out?: string;
  readonly format?: "markdown" | "json";
}

export function parseCliArgs(argv: string[]): CliParsedOptions {
  const command = (argv[0] ?? "help") as CliParsedOptions["command"];
  const rest = argv.slice(1);

  const { values, positionals } = parseArgs({
    args: rest,
    options: {
      url: { type: "string" },
      image: { type: "string" },
      platform: { type: "string", default: "all" },
      platforms: { type: "string", default: "android,windows11,ios" },
      out: { type: "string", default: "./dist/pwa" },
      format: { type: "string", default: "markdown" }
    },
    allowPositionals: true
  });

  const targetUrl = values.url ?? (command === "audit" || command === "package" ? positionals[0] : undefined);
  const targetImage = values.image ?? (command === "assets" ? positionals[0] : undefined);
  const platformList = (values.platforms || "android,windows11,ios")
    .split(",")
    .map(p => p.trim()) as StorePlatform[];

  return {
    command,
    url: targetUrl,
    image: targetImage,
    platform: values.platform as CliParsedOptions["platform"],
    platforms: platformList,
    out: values.out,
    format: values.format as "markdown" | "json"
  };
}

export async function executeCliCommand(options: CliParsedOptions, httpClient?: IHttpClient): Promise<string> {
  const sdk = new PwaBuilderSDK({ httpClient });

  if (options.command === "audit") {
    return handleAuditCommand(sdk, options);
  }
  if (options.command === "assets") {
    return handleAssetsCommand(sdk, options);
  }
  if (options.command === "package") {
    return handlePackageCommand(sdk, options);
  }
  return getHelpText();
}

async function handleAuditCommand(sdk: PwaBuilderSDK, options: CliParsedOptions): Promise<string> {
  if (!options.url) {
    throw new ValidationError("The 'audit' command requires a URL parameter.", "url");
  }
  const result = await sdk.report.analyze(options.url);
  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }
  const summary = sdk.report.summarize(result);
  return summary.toMarkdown();
}

async function handleAssetsCommand(sdk: PwaBuilderSDK, options: CliParsedOptions): Promise<string> {
  if (!options.image) {
    throw new ValidationError("The 'assets' command requires an image path or URL.", "image");
  }
  const imageBuffer = await fs.readFile(options.image);
  const archive = await sdk.images.generate({
    baseImage: imageBuffer,
    platforms: options.platforms ?? ["android", "windows11", "ios"]
  });
  const outputDir = path.resolve(options.out ?? "./dist/pwa/assets");
  await archive.extractTo(outputDir);
  return `Successfully generated store assets and extracted to: ${outputDir}`;
}

async function handlePackageCommand(sdk: PwaBuilderSDK, options: CliParsedOptions): Promise<string> {
  if (!options.url) {
    throw new ValidationError("The 'package' command requires a target PWA URL.", "url");
  }
  const report = await sdk.report.analyze(options.url);
  const baseOut = path.resolve(options.out ?? "./dist/pwa");
  const platform = options.platform ?? "all";
  const messages: string[] = [];

  if (platform === "windows" || platform === "all") {
    const winArchive = await sdk.packaging.windows.buildFromAnalysis(report);
    const winPath = path.join(baseOut, "windows", "windows-package.zip");
    await winArchive.saveTo(winPath);
    messages.push(`Windows MSIX saved: ${winPath}`);
  }
  if (platform === "ios" || platform === "all") {
    const iosArchive = await sdk.packaging.ios.buildFromAnalysis(report);
    const iosPath = path.join(baseOut, "ios", "ios-xcode-package.zip");
    await iosArchive.saveTo(iosPath);
    messages.push(`iOS Xcode project saved: ${iosPath}`);
  }
  if (platform === "android" || platform === "all") {
    const androidArchive = await sdk.packaging.android.buildFromAnalysis(report);
    const androidPath = path.join(baseOut, "android", "android-package.zip");
    await androidArchive.saveTo(androidPath);
    messages.push(`Android bundle saved: ${androidPath}`);
  }

  return messages.join("\n");
}

function getHelpText(): string {
  return [
    "PWABuilder SDK CLI",
    "",
    "Usage:",
    "  pwabuilder-sdk audit <url> [--format markdown|json]",
    "  pwabuilder-sdk assets <imagePath> [--platforms android,windows11,ios] [--out <dir>]",
    "  pwabuilder-sdk package <url> [--platform android|windows|ios|all] [--out <dir>]",
    ""
  ].join("\n");
}
