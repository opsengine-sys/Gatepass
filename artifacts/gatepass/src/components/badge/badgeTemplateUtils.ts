const STORAGE_KEY = "gp_custom_templates_v1";

export type BadgeSize = "cr80" | "a6" | "a5" | "a4";
export type ElementKind =
  | "photo" | "name" | "company" | "visitorId" | "type" | "host"
  | "purpose" | "checkIn" | "checkOut" | "qr" | "barcode"
  | "logo" | "text" | "rect" | "divider";

export interface CanvasElement {
  id: string;
  kind: ElementKind;
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  fontSize?: number;
  fontWeight?: "normal" | "semibold" | "bold";
  color?: string;
  bgColor?: string;
  borderColor?: string;
  borderRadius?: number;
  align?: "left" | "center" | "right";
  opacity?: number;
  zIndex?: number;
}

export interface CustomTemplate {
  id: string;
  name: string;
  kind: "badge" | "gp";
  size: BadgeSize;
  bgColor: string;
  elements: CanvasElement[];
  createdAt: string;
}

export function loadCustomTemplates(): CustomTemplate[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s) as CustomTemplate[];
  } catch { /* */ }
  return [];
}

export function saveCustomTemplates(templates: CustomTemplate[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(templates)); } catch { /* */ }
}
