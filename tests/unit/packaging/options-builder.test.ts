import { describe, it, expect } from "vitest";
import { AndroidOptionsBuilder } from "../../../src/packaging/android/options-builder.js";
import type { PwaAnalysisResult } from "../../../src/report/types.js";
import type { AndroidPackageOptions } from "../../../src/packaging/android/types.js";

describe("AndroidOptionsBuilder", () => {
  const sampleAnalysis: PwaAnalysisResult = {
    id: "analysis:test:1",
    url: "https://sig.timoteo.mg.gov.br/",
    status: "Completed",
    canPackage: true,
    capabilities: [],
    webManifest: {
      url: "https://sig.timoteo.mg.gov.br/manifest.webmanifest",
      manifest: {
        name: "SIG-Defesa Civil | Município de Timóteo - MG",
        short_name: "Defesa Civil",
        start_url: "/?source=pwa",
        theme_color: "#1e40af",
        background_color: "#ffffff",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", purpose: "any" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", purpose: "maskable" }
        ]
      }
    }
  };

  it("should create complete options from analysis including CloudAPK required fields", () => {
    const options = AndroidOptionsBuilder.fromAnalysis(sampleAnalysis);

    expect(options.name).toBe("SIG-Defesa Civil | Município de Timóteo - MG");
    expect(options.launcherName).toBe("Defesa Civil");
    expect(options.packageId).toBe("br.gov.mg.timoteo.sig.twa");
    expect(options.host).toBe("sig.timoteo.mg.gov.br");
    expect(options.iconUrl).toBe("https://sig.timoteo.mg.gov.br/icons/icon-512.png");
    expect(options.maskableIconUrl).toBe("https://sig.timoteo.mg.gov.br/icons/icon-maskable-512.png");
    expect(options.themeColor).toBe("#1e40af");
    expect(options.navigationColor).toBe("#1e40af");
    expect(options.navigationColorDark).toBe("#000000");
    expect(options.splashScreenFadeOutDuration).toBe(300);
    expect(options.signingMode).toBe("new");
    expect(options.signing).toBeDefined();
    expect(options.signing?.countryCode).toBe("BR");
    expect(options.startUrl).toBe("/?source=pwa");
  });

  it("should respect explicit overrides", () => {
    const options = AndroidOptionsBuilder.fromAnalysis(sampleAnalysis, {
      name: "SIG Defesa Civil",
      packageId: "br.gov.mg.timoteo.defesacivil",
      navigationColor: "#ffffff",
      splashScreenFadeOutDuration: 500,
      signingMode: "none"
    });

    expect(options.name).toBe("SIG Defesa Civil");
    expect(options.packageId).toBe("br.gov.mg.timoteo.defesacivil");
    expect(options.navigationColor).toBe("#ffffff");
    expect(options.splashScreenFadeOutDuration).toBe(500);
    expect(options.signingMode).toBe("none");
    expect(options.signing).toBeNull();
  });

  it("should normalize minimal options to ensure CloudAPK compatibility", () => {
    const minimal: AndroidPackageOptions = {
      appVersion: "1.0.0.0",
      appVersionCode: 1,
      backgroundColor: "#ffffff",
      display: "standalone",
      enableNotifications: true,
      enableSiteSettingsShortcut: true,
      fallbackType: "customtabs",
      features: { locationDelegation: { enabled: false }, playBilling: { enabled: false } },
      host: "example.com",
      iconUrl: "https://example.com/icon.png",
      name: "Minimal App",
      launcherName: "Minimal",
      packageId: "com.example.minimal.twa",
      startUrl: "/",
      themeColor: "#123456",
      webManifestUrl: "https://example.com/manifest.json",
      pwaUrl: "https://example.com"
    };

    const normalized = AndroidOptionsBuilder.normalize(minimal);
    expect(normalized.navigationColor).toBe("#123456");
    expect(normalized.splashScreenFadeOutDuration).toBe(300);
    expect(normalized.signingMode).toBe("new");
    expect(normalized.signing).toBeDefined();
  });
});
