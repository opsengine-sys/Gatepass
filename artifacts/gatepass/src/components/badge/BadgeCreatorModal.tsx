import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeSize = "cr80" | "a6" | "a5" | "a4";
export type ElementKind =
  | "photo" | "name" | "company" | "visitorId" | "type" | "host"
  | "purpose" | "checkIn" | "checkOut" | "qr" | "barcode"
  | "logo" | "text" | "rect" | "divider";

export interface CanvasElement {
  id: string;
  kind: ElementKind;
  x: number;  // 0-100 percent
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

// ─── Constants ────────────────────────────────────────────────────────────────

const BADGE_SIZES: { id: BadgeSize; label: string; sub: string; w: number; h: number }[] = [
  { id: "cr80", label: "CR80 Card",    sub: "85.6 × 54 mm · Standard badge", w: 340, h: 215 },
  { id: "a6",   label: "A6",           sub: "148 × 105 mm · Larger badge",    w: 340, h: 242 },
  { id: "a5",   label: "A5",           sub: "148 × 210 mm · Half A4",         w: 215, h: 303 },
  { id: "a4",   label: "A4",           sub: "210 × 297 mm · Gate pass sheet", w: 215, h: 303 },
];

const ELEMENT_PALETTE: { kind: ElementKind; label: string; icon: string; category: string }[] = [
  { kind: "photo",     label: "Visitor Photo",  icon: "👤", category: "Visitor Data" },
  { kind: "name",      label: "Full Name",      icon: "📛", category: "Visitor Data" },
  { kind: "company",   label: "Company",        icon: "🏢", category: "Visitor Data" },
  { kind: "type",      label: "Visitor Type",   icon: "🏷️", category: "Visitor Data" },
  { kind: "host",      label: "Host Name",      icon: "👥", category: "Visitor Data" },
  { kind: "purpose",   label: "Purpose",        icon: "📝", category: "Visitor Data" },
  { kind: "visitorId", label: "Visitor ID",     icon: "🔢", category: "Visitor Data" },
  { kind: "checkIn",   label: "Check-in Time",  icon: "⏰", category: "Visitor Data" },
  { kind: "checkOut",  label: "Expected Out",   icon: "⏱️", category: "Visitor Data" },
  { kind: "qr",        label: "QR Code",        icon: "⬛", category: "Identifiers" },
  { kind: "barcode",   label: "Barcode",        icon: "▬", category: "Identifiers" },
  { kind: "logo",      label: "Company Logo",   icon: "🖼️", category: "Branding" },
  { kind: "text",      label: "Static Text",    icon: "T", category: "Layout" },
  { kind: "rect",      label: "Color Block",    icon: "⬜", category: "Layout" },
  { kind: "divider",   label: "Divider Line",   icon: "—", category: "Layout" },
];

const STORAGE_KEY = "gp_custom_templates_v1";

// ─── Default elements ─────────────────────────────────────────────────────────

function defaultElements(kind: "badge" | "gp", size: BadgeSize): CanvasElement[] {
  if (kind === "badge") {
    return [
      { id: "1", kind: "rect",      x: 0,   y: 0,   w: 100, h: 14, bgColor: "#c06b2c", color: "#ffffff", zIndex: 0 },
      { id: "2", kind: "logo",      x: 2,   y: 1,   w: 10,  h: 12, zIndex: 1 },
      { id: "3", kind: "text",      x: 15,  y: 3,   w: 50,  h: 8,  label: "VISITOR PASS", fontSize: 10, fontWeight: "bold", color: "#ffffff", zIndex: 1 },
      { id: "4", kind: "photo",     x: 3,   y: 18,  w: 22,  h: 40, borderRadius: 6, zIndex: 1 },
      { id: "5", kind: "name",      x: 30,  y: 20,  w: 65,  h: 12, fontSize: 16, fontWeight: "bold", color: "#111827", zIndex: 1 },
      { id: "6", kind: "company",   x: 30,  y: 34,  w: 65,  h: 8,  fontSize: 11, color: "#6b7280", zIndex: 1 },
      { id: "7", kind: "type",      x: 30,  y: 44,  w: 30,  h: 8,  fontSize: 10, bgColor: "#c06b2c", color: "#ffffff", borderRadius: 4, zIndex: 1 },
      { id: "8", kind: "visitorId", x: 3,   y: 62,  w: 35,  h: 8,  fontSize: 10, color: "#374151", zIndex: 1 },
      { id: "9", kind: "qr",        x: 75,  y: 60,  w: 20,  h: 35, zIndex: 1 },
      { id: "10", kind: "host",     x: 3,   y: 72,  w: 60,  h: 8,  fontSize: 10, color: "#6b7280", zIndex: 1 },
      { id: "11", kind: "rect",     x: 0,   y: 92,  w: 100, h: 8,  bgColor: "#f3f4f6", zIndex: 0 },
      { id: "12", kind: "checkIn",  x: 3,   y: 93,  w: 40,  h: 6,  fontSize: 9, color: "#9ca3af", zIndex: 1 },
    ];
  }
  return [
    { id: "1", kind: "rect",      x: 0,   y: 0,   w: 100, h: 10, bgColor: "#0d9488", zIndex: 0 },
    { id: "2", kind: "logo",      x: 2,   y: 1,   w: 8,   h: 8,  zIndex: 1 },
    { id: "3", kind: "text",      x: 14,  y: 2,   w: 50,  h: 6,  label: "GATE PASS", fontSize: 11, fontWeight: "bold", color: "#ffffff", zIndex: 1 },
    { id: "4", kind: "visitorId", x: 70,  y: 2,   w: 28,  h: 6,  fontSize: 10, color: "#ffffff", zIndex: 1 },
    { id: "5", kind: "name",      x: 3,   y: 14,  w: 55,  h: 10, fontSize: 15, fontWeight: "bold", color: "#111827", zIndex: 1 },
    { id: "6", kind: "company",   x: 3,   y: 26,  w: 55,  h: 7,  fontSize: 11, color: "#6b7280", zIndex: 1 },
    { id: "7", kind: "divider",   x: 0,   y: 36,  w: 100, h: 0.5, bgColor: "#e5e7eb", zIndex: 1 },
    { id: "8", kind: "purpose",   x: 3,   y: 40,  w: 55,  h: 8,  fontSize: 11, color: "#374151", zIndex: 1 },
    { id: "9", kind: "host",      x: 3,   y: 50,  w: 55,  h: 8,  fontSize: 11, color: "#374151", zIndex: 1 },
    { id: "10", kind: "checkIn",  x: 3,   y: 60,  w: 45,  h: 7,  fontSize: 10, color: "#6b7280", zIndex: 1 },
    { id: "11", kind: "checkOut", x: 50,  y: 60,  w: 47,  h: 7,  fontSize: 10, color: "#6b7280", zIndex: 1 },
    { id: "12", kind: "qr",       x: 62,  y: 13,  w: 18,  h: 30, zIndex: 1 },
    { id: "13", kind: "barcode",  x: 3,   y: 70,  w: 55,  h: 12, zIndex: 1 },
    { id: "14", kind: "rect",     x: 0,   y: 92,  w: 100, h: 8,  bgColor: "#f3f4f6", zIndex: 0 },
    { id: "15", kind: "text",     x: 3,   y: 93.5, w: 60, h: 5,  label: "Authorised by Security", fontSize: 9, color: "#9ca3af", zIndex: 1 },
  ];
}

// ─── Load / save ──────────────────────────────────────────────────────────────

export function loadCustomTemplates(): CustomTemplate[] {
  try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s); } catch { /* */ }
  return [];
}
function saveCustomTemplates(t: CustomTemplate[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch { /* */ }
}

// ─── Element renderer ─────────────────────────────────────────────────────────

function ElementPreview({ el, selected, canvasW, canvasH }: {
  el: CanvasElement; selected: boolean; canvasW: number; canvasH: number;
}) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.w}%`,
    height: `${el.h}%`,
    zIndex: el.zIndex ?? 1,
    boxSizing: "border-box",
    outline: selected ? "2px solid #3b82f6" : undefined,
    outlineOffset: selected ? "1px" : undefined,
  };

  const fontSize = el.fontSize ? Math.max(6, (el.fontSize / 100) * canvasW * 0.7) : 11;

  if (el.kind === "rect" || el.kind === "divider") {
    return (
      <div style={{ ...style, backgroundColor: el.bgColor ?? "#e5e7eb", borderRadius: el.borderRadius ?? 0, opacity: el.opacity ?? 1 }} />
    );
  }
  if (el.kind === "photo") {
    return (
      <div style={{ ...style, backgroundColor: "#d1d5db", borderRadius: `${el.borderRadius ?? 4}px`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" style={{ width: "40%", height: "40%" }}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    );
  }
  if (el.kind === "logo") {
    return (
      <div style={{ ...style, backgroundColor: "#f3f4f6", borderRadius: `${el.borderRadius ?? 4}px`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" style={{ width: "60%", height: "60%" }}>
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
    );
  }
  if (el.kind === "qr") {
    return (
      <div style={{ ...style, backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "3px", display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "2px", padding: "4px" }}>
        {[...Array(25)].map((_, i) => (
          <div key={i} style={{ backgroundColor: [0,1,5,6,7,10,14,18,19,20,23,24].includes(i) ? "#1f2937" : "#fff", borderRadius: "1px" }} />
        ))}
      </div>
    );
  }
  if (el.kind === "barcode") {
    return (
      <div style={{ ...style, display: "flex", alignItems: "flex-end", gap: "1px", overflow: "hidden" }}>
        {[...Array(28)].map((_, i) => (
          <div key={i} style={{ flex: 1, height: `${55 + (i % 3) * 25}%`, backgroundColor: "#1f2937", borderRadius: "0.5px" }} />
        ))}
      </div>
    );
  }

  const labelMap: Record<ElementKind, string> = {
    name: el.label ?? "Rajesh Kumar",
    company: el.label ?? "TechCorp Pvt. Ltd.",
    type: el.label ?? "Vendor",
    host: el.label ?? "Host: Priya Sharma",
    purpose: el.label ?? "Purpose: Technical Meeting",
    visitorId: el.label ?? "V-2024-0042",
    checkIn: el.label ?? "In: 10:30 AM",
    checkOut: el.label ?? "Out: 04:00 PM",
    text: el.label ?? "Static Text",
    photo: "", logo: "", qr: "", barcode: "", rect: "", divider: "",
  };

  const text = labelMap[el.kind] ?? el.label ?? el.kind;
  const hasBg = el.bgColor && el.kind !== "text";

  return (
    <div style={{
      ...style,
      backgroundColor: hasBg ? el.bgColor : "transparent",
      borderRadius: hasBg ? `${el.borderRadius ?? 4}px` : 0,
      display: "flex",
      alignItems: "center",
      justifyContent: el.align === "center" ? "center" : el.align === "right" ? "flex-end" : "flex-start",
      paddingLeft: el.align !== "center" && el.align !== "right" ? "4px" : 0,
      paddingRight: el.align === "right" ? "4px" : 0,
      overflow: "hidden",
    }}>
      <span style={{
        fontSize,
        fontWeight: el.fontWeight === "bold" ? 700 : el.fontWeight === "semibold" ? 600 : 400,
        color: el.color ?? "#111827",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "100%",
      }}>{text}</span>
    </div>
  );
}

// ─── Properties Panel ─────────────────────────────────────────────────────────

function PropPanel({ el, onChange, onDelete }: {
  el: CanvasElement;
  onChange: (patch: Partial<CanvasElement>) => void;
  onDelete: () => void;
}) {
  const labelCls = "text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1";
  const inputCls = "w-full text-[12px] bg-background border border-input rounded-lg px-2.5 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all";
  const numCls = cn(inputCls, "font-mono");
  const labelKind = ELEMENT_PALETTE.find(p => p.kind === el.kind);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-foreground">{labelKind?.icon} {labelKind?.label ?? el.kind}</div>
          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{el.id}</div>
        </div>
        <button onClick={onDelete} className="text-destructive/60 hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/8 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>

      <div className="border-t border-border pt-3 space-y-3">
        <div>
          <label className={labelCls}>Position & Size</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(["x","y","w","h"] as const).map(k => (
              <div key={k}>
                <div className="text-[9px] text-muted-foreground mb-0.5 uppercase">{k === "x" ? "Left %" : k === "y" ? "Top %" : k === "w" ? "Width %" : "Height %"}</div>
                <input type="number" className={numCls} value={Math.round(el[k] * 10) / 10}
                  onChange={e => onChange({ [k]: parseFloat(e.target.value) || 0 })}
                  min={0} max={k === "x" || k === "w" ? 100 : 100} step={0.5} />
              </div>
            ))}
          </div>
        </div>

        {(el.kind === "text" || el.kind === "name" || el.kind === "company" || el.kind === "type" || el.kind === "host" || el.kind === "purpose" || el.kind === "visitorId" || el.kind === "checkIn" || el.kind === "checkOut") && (
          <div>
            <label className={labelCls}>Text Content</label>
            <input className={inputCls} value={el.label ?? ""}
              placeholder="Leave blank to use live data"
              onChange={e => onChange({ label: e.target.value })} />
          </div>
        )}

        {el.kind !== "photo" && el.kind !== "logo" && el.kind !== "qr" && el.kind !== "barcode" && el.kind !== "rect" && el.kind !== "divider" && (
          <div>
            <label className={labelCls}>Typography</label>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <div className="text-[9px] text-muted-foreground mb-0.5">Font size (px)</div>
                <input type="number" className={numCls} value={el.fontSize ?? 12}
                  onChange={e => onChange({ fontSize: parseInt(e.target.value) || 12 })}
                  min={6} max={48} />
              </div>
              <div>
                <div className="text-[9px] text-muted-foreground mb-0.5">Weight</div>
                <select className={inputCls} value={el.fontWeight ?? "normal"}
                  onChange={e => onChange({ fontWeight: e.target.value as CanvasElement["fontWeight"] })}>
                  <option value="normal">Normal</option>
                  <option value="semibold">Semibold</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
            </div>
            <div className="mt-1.5">
              <div className="text-[9px] text-muted-foreground mb-0.5">Alignment</div>
              <div className="flex gap-1">
                {(["left","center","right"] as const).map(a => (
                  <button key={a} onClick={() => onChange({ align: a })}
                    className={cn("flex-1 py-1 rounded text-[10px] border transition-colors", el.align === a ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
                    {a === "left" ? "L" : a === "center" ? "C" : "R"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className={labelCls}>Colors</label>
          <div className="space-y-1.5">
            {el.kind !== "rect" && el.kind !== "divider" && (
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-muted-foreground w-16 flex-shrink-0">Text</label>
                <input type="color" value={el.color ?? "#111827"} onChange={e => onChange({ color: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border border-border p-0.5 bg-transparent" />
                <input className={cn(inputCls, "flex-1 font-mono text-[11px]")} value={el.color ?? "#111827"}
                  onChange={e => onChange({ color: e.target.value })} maxLength={7} />
              </div>
            )}
            {el.kind !== "divider" && el.kind !== "photo" && el.kind !== "logo" && el.kind !== "qr" && el.kind !== "barcode" && (
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-muted-foreground w-16 flex-shrink-0">Background</label>
                <input type="color" value={el.bgColor ?? "#ffffff"} onChange={e => onChange({ bgColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border border-border p-0.5 bg-transparent" />
                <input className={cn(inputCls, "flex-1 font-mono text-[11px]")} value={el.bgColor ?? "#ffffff"}
                  onChange={e => onChange({ bgColor: e.target.value })} maxLength={7} />
              </div>
            )}
          </div>
        </div>

        {(el.kind === "photo" || el.kind === "logo" || el.kind === "qr" || el.kind === "text" || el.kind === "rect" || el.kind === "type") && (
          <div>
            <label className={labelCls}>Corner Radius (px)</label>
            <input type="number" className={numCls} value={el.borderRadius ?? 0}
              onChange={e => onChange({ borderRadius: parseInt(e.target.value) || 0 })}
              min={0} max={50} />
          </div>
        )}

        <div>
          <label className={labelCls}>Layer Z-Index</label>
          <input type="number" className={numCls} value={el.zIndex ?? 1}
            onChange={e => onChange({ zIndex: parseInt(e.target.value) || 0 })}
            min={0} max={20} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface BadgeCreatorModalProps {
  kind: "badge" | "gp";
  onClose: () => void;
  onSave?: (t: CustomTemplate) => void;
  editTemplate?: CustomTemplate;
}

export function BadgeCreatorModal({ kind, onClose, onSave, editTemplate }: BadgeCreatorModalProps) {
  const title = kind === "badge" ? "Badge Creator" : "Gate Pass Creator";

  const [step, setStep] = useState<"size" | "design">(editTemplate ? "design" : "size");
  const [selectedSize, setSelectedSize] = useState<BadgeSize>(editTemplate?.size ?? "cr80");
  const [bgColor, setBgColor] = useState(editTemplate?.bgColor ?? "#ffffff");
  const [elements, setElements] = useState<CanvasElement[]>(editTemplate?.elements ?? []);
  const [selected, setSelected] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState(editTemplate?.name ?? "");
  const [namingOpen, setNamingOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(100);

  const sizeInfo = BADGE_SIZES.find(s => s.id === selectedSize)!;

  const addElement = useCallback((kind: ElementKind) => {
    const id = String(nextId.current++);
    const defaults: Partial<CanvasElement> = {};
    if (kind === "rect") { defaults.bgColor = "#e5e7eb"; defaults.w = 40; defaults.h = 10; }
    else if (kind === "divider") { defaults.bgColor = "#e5e7eb"; defaults.w = 100; defaults.h = 0.8; }
    else if (kind === "photo") { defaults.w = 22; defaults.h = 35; defaults.borderRadius = 4; }
    else if (kind === "logo") { defaults.w = 15; defaults.h = 12; }
    else if (kind === "qr") { defaults.w = 18; defaults.h = 28; }
    else if (kind === "barcode") { defaults.w = 50; defaults.h = 10; }
    else if (kind === "name") { defaults.fontSize = 16; defaults.fontWeight = "bold"; defaults.color = "#111827"; defaults.w = 60; defaults.h = 10; }
    else { defaults.fontSize = 11; defaults.color = "#374151"; defaults.w = 40; defaults.h = 8; }

    const el: CanvasElement = {
      id, kind, x: 5, y: 5,
      w: defaults.w ?? 30, h: defaults.h ?? 8,
      ...defaults, zIndex: 1,
    };
    setElements(prev => [...prev, el]);
    setSelected(id);
  }, []);

  const updateElement = useCallback((id: string, patch: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...patch } : el));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelected(null);
  }, []);

  const handleSave = () => {
    if (!templateName.trim()) { toast.error("Give your template a name"); return; }
    const t: CustomTemplate = {
      id: editTemplate?.id ?? Date.now().toString(),
      name: templateName.trim(),
      kind,
      size: selectedSize,
      bgColor,
      elements,
      createdAt: editTemplate?.createdAt ?? new Date().toISOString(),
    };
    const existing = loadCustomTemplates();
    const updated = editTemplate
      ? existing.map(x => x.id === t.id ? t : x)
      : [...existing, t];
    saveCustomTemplates(updated);
    onSave?.(t);
    toast.success(`Template "${t.name}" saved`);
    onClose();
  };

  const categories = [...new Set(ELEMENT_PALETTE.map(p => p.category))];

  const sortedElements = [...elements].sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1));
  const selectedEl = elements.find(el => el.id === selected) ?? null;

  const canvasPx = { w: 380, h: Math.round(380 * (sizeInfo.h / sizeInfo.w)) };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex">
      <div className="flex flex-col flex-1 bg-background overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-3.5 h-3.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4M9 17h3"/>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-[14px] text-foreground">{title}</div>
              <div className="text-[10.5px] text-muted-foreground">
                {step === "size" ? "Choose canvas size" : `${sizeInfo.label} · ${elements.length} elements`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === "design" && (
              <>
                <button onClick={() => setElements(defaultElements(kind, selectedSize))}
                  className="text-[12px] font-medium text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-secondary transition-all">
                  Reset to Default
                </button>
                <button onClick={() => setNamingOpen(true)}
                  className="flex items-center gap-1.5 text-[12.5px] font-semibold bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-all shadow-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3.5 h-3.5">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save Template
                </button>
              </>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Step: Size ── */}
        {step === "size" && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-8">
                <div className="text-[22px] font-bold text-foreground tracking-tight mb-2">Choose a canvas size</div>
                <div className="text-[14px] text-muted-foreground">Pick the physical size of your {kind === "badge" ? "badge" : "gate pass"}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {BADGE_SIZES.map(s => (
                  <button key={s.id} onClick={() => setSelectedSize(s.id)}
                    className={cn(
                      "text-left border-2 rounded-2xl p-5 transition-all hover:shadow-md",
                      selectedSize === s.id ? "border-primary bg-orange-50 shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]" : "border-border hover:border-primary/30"
                    )}>
                    <div className="flex items-start gap-4">
                      <div className="relative flex-shrink-0"
                        style={{ width: 40, height: Math.round(40 * (s.h / s.w)) }}>
                        <div className={cn(
                          "absolute inset-0 border-2 rounded",
                          selectedSize === s.id ? "border-primary bg-primary/8" : "border-border bg-secondary"
                        )} />
                      </div>
                      <div>
                        <div className="font-semibold text-[14px] text-foreground">{s.label}</div>
                        <div className="text-[12px] text-muted-foreground mt-0.5">{s.sub}</div>
                        {selectedSize === s.id && (
                          <div className="mt-1.5 text-[10px] font-bold text-primary">Selected ✓</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-border p-0.5 bg-transparent" />
                    <input className="bg-secondary border border-border rounded-lg px-3 py-2 text-[12px] font-mono uppercase outline-none focus:border-primary w-28"
                      value={bgColor} onChange={e => setBgColor(e.target.value)} maxLength={7} />
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  {["#ffffff", "#f8fafc", "#1e293b", "#fef3c7", "#f0fdf4"].map(c => (
                    <button key={c} onClick={() => setBgColor(c)}
                      className={cn("w-8 h-8 rounded-lg border-2 transition-all hover:scale-105",
                        bgColor === c ? "border-primary scale-110" : "border-border")}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={onClose} className="text-[13px] font-medium border border-border px-5 py-2.5 rounded-xl hover:bg-secondary transition-all">Cancel</button>
                <button onClick={() => { setElements(defaultElements(kind, selectedSize)); setStep("design"); }}
                  className="flex items-center gap-2 text-[13px] font-semibold bg-primary text-white px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-sm">
                  Start Designing
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step: Design ── */}
        {step === "design" && (
          <div className="flex flex-1 overflow-hidden">

            {/* Left: element palette */}
            <div className="w-52 border-r border-border bg-card/60 overflow-y-auto flex-shrink-0">
              <div className="sticky top-0 px-3 py-2.5 bg-card/90 backdrop-blur border-b border-border">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Add Elements</div>
              </div>
              {categories.map(cat => (
                <div key={cat} className="px-2 py-2">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-1">{cat}</div>
                  {ELEMENT_PALETTE.filter(p => p.category === cat).map(p => (
                    <button key={p.kind} onClick={() => addElement(p.kind)}
                      className="w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded-lg hover:bg-secondary transition-colors group">
                      <span className="text-[14px] w-5 text-center">{p.icon}</span>
                      <span className="text-[12px] font-medium text-foreground group-hover:text-primary transition-colors">{p.label}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 ml-auto text-muted-foreground/30 group-hover:text-primary/60">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  ))}
                </div>
              ))}

              {/* Layer list */}
              {elements.length > 0 && (
                <div className="px-2 pb-3 mt-1 border-t border-border">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-2">Layers ({elements.length})</div>
                  {[...elements].reverse().map(el => {
                    const info = ELEMENT_PALETTE.find(p => p.kind === el.kind);
                    return (
                      <button key={el.id} onClick={() => setSelected(el.id)}
                        className={cn("w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-left",
                          selected === el.id ? "bg-primary/8 border border-primary/20" : "hover:bg-secondary border border-transparent")}>
                        <span className="text-[11px] w-4 text-center">{info?.icon ?? "?"}</span>
                        <span className={cn("text-[11px] flex-1 truncate", selected === el.id ? "font-semibold text-foreground" : "text-muted-foreground")}>{info?.label ?? el.kind}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Center: canvas */}
            <div className="flex-1 overflow-auto bg-secondary/30 flex items-start justify-center p-8">
              <div>
                <div className="mb-3 flex items-center gap-3 justify-center">
                  <span className="text-[11px] font-semibold text-muted-foreground">{sizeInfo.label}</span>
                  <span className="text-[11px] text-muted-foreground/50">·</span>
                  <span className="text-[11px] text-muted-foreground">{sizeInfo.sub}</span>
                  <button onClick={() => setStep("size")} className="text-[11px] text-primary hover:underline">Change</button>
                </div>

                <div className="mb-4 flex items-center gap-2 justify-center flex-wrap">
                  <span className="text-[10px] text-muted-foreground">Background:</span>
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-border p-0.5 bg-transparent" />
                  <input className="bg-background border border-border rounded px-2 py-0.5 text-[11px] font-mono uppercase outline-none focus:border-primary w-20"
                    value={bgColor} onChange={e => setBgColor(e.target.value)} maxLength={7} />
                </div>

                {/* The canvas */}
                <div
                  ref={canvasRef}
                  className="relative shadow-2xl"
                  style={{
                    width: canvasPx.w,
                    height: canvasPx.h,
                    backgroundColor: bgColor,
                    cursor: "default",
                  }}
                  onClick={e => { if (e.target === canvasRef.current) setSelected(null); }}
                >
                  {sortedElements.map(el => (
                    <div key={el.id}
                      className="absolute cursor-pointer"
                      style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`, zIndex: el.zIndex ?? 1 }}
                      onClick={e => { e.stopPropagation(); setSelected(el.id); }}>
                      <ElementPreview el={el} selected={selected === el.id} canvasW={canvasPx.w} canvasH={canvasPx.h} />
                    </div>
                  ))}

                  {elements.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <div className="text-[13px] font-semibold text-muted-foreground/40">Empty canvas</div>
                      <div className="text-[11px] text-muted-foreground/30 mt-1">Add elements from the left panel</div>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-center text-[10px] text-muted-foreground">
                  Click an element to select it · Edit properties in the right panel
                </div>
              </div>
            </div>

            {/* Right: properties */}
            <div className="w-60 border-l border-border bg-card/60 overflow-y-auto flex-shrink-0">
              <div className="sticky top-0 px-3 py-2.5 bg-card/90 backdrop-blur border-b border-border">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {selectedEl ? "Properties" : "Select an element"}
                </div>
              </div>
              {selectedEl ? (
                <PropPanel
                  el={selectedEl}
                  onChange={patch => updateElement(selectedEl.id, patch)}
                  onDelete={() => deleteElement(selectedEl.id)}
                />
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 opacity-40">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="10 17 15 12 10 7"/>
                    </svg>
                  </div>
                  <div className="text-[12px] font-medium text-muted-foreground">No element selected</div>
                  <div className="text-[11px] text-muted-foreground/60 mt-1">Click any element on the canvas to edit its properties</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Naming Dialog ── */}
        {namingOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setNamingOpen(false)} />
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
              <h3 className="text-[16px] font-semibold text-foreground mb-1">Save Template</h3>
              <p className="text-[12.5px] text-muted-foreground mb-4">Give this template a name so you can find it easily.</p>
              <input
                className="w-full text-[13px] bg-background border border-input rounded-xl px-3.5 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all mb-4"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                placeholder="e.g. Corporate Visitor Badge"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setNamingOpen(false)} className="text-[13px] font-medium border border-border px-4 py-2 rounded-xl hover:bg-secondary transition-all">Cancel</button>
                <button onClick={handleSave} className="text-[13px] font-semibold bg-primary text-white px-5 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-sm">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
