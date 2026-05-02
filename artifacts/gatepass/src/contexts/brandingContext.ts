import { createContext } from "react";

export interface BrandingSettings {
  logoUrl: string | null;
  primaryColor: string;
  font: string;
  companyName: string;
  theme: "light" | "dark" | "system";
}

export interface BrandingCtx extends BrandingSettings {
  update: (patch: Partial<BrandingSettings>) => void;
}

export const DEFAULT_BRANDING: BrandingSettings = {
  logoUrl: null,
  primaryColor: "#c06b2c",
  font: "Plus Jakarta Sans",
  companyName: "GatePass",
  theme: "light",
};

export const BrandingContext = createContext<BrandingCtx>({
  ...DEFAULT_BRANDING,
  update: () => {},
});
