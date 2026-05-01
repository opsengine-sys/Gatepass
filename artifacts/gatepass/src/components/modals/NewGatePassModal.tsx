import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { GP_TYPES, OFFICES } from "@/types";
import type { GatePass, GPItem, GPType } from "@/types";
import { cn } from "@/lib/utils";

function blankForm(office: string) {
  return {
    type: "material" as GPType,
    requestedBy: "",
    requesterPhone: "",
    vendor: "",
    vehicleNo: "",
    expectedDate: new Date().toISOString().split("T")[0],
    office,
    purpose: "",
    items: [{ name: "", qty: "", desc: "" }] as GPItem[],
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (gp: GatePass) => void;
  currentOffice: string;
}

export function NewGatePassModal({ open, onClose, onSubmit, currentOffice }: Props) {
  const [form, setForm] = useState(() => blankForm(currentOffice));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sf = (k: string, v: unknown) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => { const n = {...prev}; delete n[k]; return n; });
  };

  const updateItem = (i: number, k: keyof GPItem, v: string) => {
    setForm(prev => {
      const items = [...prev.items];
      items[i] = { ...items[i], [k]: v };
      return { ...prev, items };
    });
  };

  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { name: "", qty: "", desc: "" }] }));
  const removeItem = (i: number) => setForm(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.requestedBy.trim()) e.requestedBy = "Required";
    if (!form.purpose.trim()) e.purpose = "Required";
    const validItems = form.items.filter(it => it.name.trim());
    if (validItems.length === 0) e.items = "At least one item is required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const id = Math.random().toString(36).slice(2, 9);
    const gpId = "GPP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const gp: GatePass = {
      ...form,
      id,
      gpId,
      status: "open",
      createdAt: new Date().toISOString(),
      items: form.items.filter(it => it.name.trim()),
    };
    onSubmit(gp);
    setForm(blankForm(currentOffice));
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[720px] max-h-[93vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-[19px] font-medium">New Gate Pass</DialogTitle>
          <p className="text-[12.5px] text-muted-foreground">Create a materials / supplies / food pass</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Pass Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GP_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => sf("type", t.id)}
                  className={cn(
                    "border-[1.5px] rounded-xl p-3 cursor-pointer transition-all text-left",
                    form.type === t.id
                      ? "bg-teal-50 border-teal-500"
                      : "border-border hover:border-border/80 hover:bg-secondary"
                  )}
                >
                  <div className={cn("text-[13px] font-semibold mb-0.5", form.type === t.id ? "text-teal-700" : "text-foreground")}>{t.label}</div>
                  <div className="text-[11px] text-muted-foreground">{t.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold pb-2 border-b border-border">
            Requester & Logistics
          </div>
          <div className="grid grid-cols-2 gap-3">
            <GField label="Requested By" required error={errors.requestedBy}>
              <input className={iCls(!!errors.requestedBy)} value={form.requestedBy} placeholder="e.g. Facilities Team" onChange={e => sf("requestedBy", e.target.value)} />
            </GField>
            <GField label="Requester Phone">
              <input className={iCls(false)} value={form.requesterPhone} placeholder="Optional" onChange={e => sf("requesterPhone", e.target.value)} />
            </GField>
            <GField label="Vendor / Supplier">
              <input className={iCls(false)} value={form.vendor} placeholder="e.g. Ashok Hardware" onChange={e => sf("vendor", e.target.value)} />
            </GField>
            <GField label="Vehicle No.">
              <input className={iCls(false)} value={form.vehicleNo} placeholder="e.g. TS09EF1234" onChange={e => sf("vehicleNo", e.target.value)} />
            </GField>
            <GField label="Expected Date">
              <input type="date" className={iCls(false)} value={form.expectedDate} onChange={e => sf("expectedDate", e.target.value)} />
            </GField>
            <GField label="Office">
              <select className={iCls(false)} value={form.office} onChange={e => sf("office", e.target.value)}>
                {OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </GField>
            <GField label="Purpose" required error={errors.purpose} className="col-span-2">
              <input className={iCls(!!errors.purpose)} value={form.purpose} placeholder="Brief description of pass purpose" onChange={e => sf("purpose", e.target.value)} />
            </GField>
          </div>

          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                Items / Materials
                {errors.items && <span className="text-red-500 ml-2 text-[10px]">{errors.items}</span>}
              </span>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: "2fr 1fr 2fr auto" }}>
                  <input className={iCls(false)} value={item.name} placeholder="Item name" onChange={e => updateItem(i, "name", e.target.value)} />
                  <input className={iCls(false)} value={item.qty} placeholder="Qty" onChange={e => updateItem(i, "qty", e.target.value)} />
                  <input className={iCls(false)} value={item.desc ?? ""} placeholder="Description (opt.)" onChange={e => updateItem(i, "desc", e.target.value)} />
                  <button type="button" onClick={() => removeItem(i)} className="btn-danger-sm p-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem} className="btn-ghost-sm mt-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Item
            </button>
          </div>
        </div>

        <DialogFooter>
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="button" onClick={handleSubmit} className="btn-teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>
            Create Gate Pass
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GField({ label, required, error, children, className }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

function iCls(err: boolean) {
  return cn(
    "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[13.5px] text-foreground font-sans transition-all outline-none appearance-none",
    "focus:border-teal-500 focus:bg-card focus:ring-2 focus:ring-teal-500/10",
    "placeholder:text-muted-foreground/60",
    err && "border-red-400",
  );
}
