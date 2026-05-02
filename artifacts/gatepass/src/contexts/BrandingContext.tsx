import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface BrandingSettings {
  logoUrl: string | null;
  primaryColor: string;
  font: string;
  companyName: string;
}

const DEFAULT: BrandingSettings = {
  logoUrl: null,
  primaryColor: "#c06b2c",
  font: "Plus Jakarta Sans",
  companyName: "GatePass",
};

const STORAGE_KEY = "gp_branding_v1";

function hexToHSL(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const BUNDLED_FONTS = new Set(["Inter", "Plus Jakarta Sans", "JetBrains Mono"]);

function ensureFont(font: string) {
  const id = `gf-${font.toLowerCase().replace(/\s+/g, "-")}`;
  if (document.getElementById(id) || BUNDLED_FONTS.has(font)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

interface BrandingCtx extends BrandingSettings {
  update: (patch: Partial<BrandingSettings>) => void;
}

const BrandingContext = createContext<BrandingCtx>({ ...DEFAULT, update: () => {} });

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT, ...JSON.parse(stored) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const hsl = hexToHSL(branding.primaryColor);
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--ring", hsl);
    root.style.setProperty("--accent", hsl);
    root.style.setProperty("--sidebar-primary", hsl);
    root.style.setProperty("--chart-1", hsl);
    ensureFont(branding.font);
    root.style.setProperty("--app-font-sans", `'${branding.font}', sans-serif`);
  }, [branding.primaryColor, branding.font]);

  const update = (patch: Partial<BrandingSettings>) => {
    setBranding(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <BrandingContext.Provider value={{ ...branding, update }}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);
