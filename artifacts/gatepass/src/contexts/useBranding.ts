import { useContext } from "react";
import { BrandingContext } from "./brandingContext";

export const useBranding = () => useContext(BrandingContext);
