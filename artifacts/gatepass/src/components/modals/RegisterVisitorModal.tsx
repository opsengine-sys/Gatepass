import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { VISITOR_TYPES } from "@/types";
import type { VisitorType } from "@/types";
import { cn } from "@/lib/utils";

interface NewVisitorData {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  type: VisitorType;
  hostName?: string | null;
  purpose?: string | null;
  photoDataUrl?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewVisitorData) => Promise<void>;
}

function blank(): NewVisitorData {
  return {
    name: "", company: "", email: "", phone: "",
    type: "Guest", hostName: "", purpose: "", photoDataUrl: undefined,
  };
}

export function RegisterVisitorModal({ open, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<NewVisitorData>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [camActive, setCamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const sf = (k: keyof NewVisitorData, v: unknown) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => { const n = { ...prev }; delete n[k as string]; return n; });
  };

  const startCam = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setCamActive(true);
    } catch {
      alert("Camera access denied");
    }
  }, []);

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCamActive(false);
  }, []);

  const capture = useCallback(() => {
    if (!videoRef.current) return;
    const c = document.createElement("canvas");
    c.width = videoRef.current.videoWidth;
    c.height = videoRef.current.videoHeight;
    c.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    sf("photoDataUrl", c.toDataURL("image/jpeg"));
    stopCam();
  }, [stopCam]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.hostName?.trim()) e.hostName = "Host name is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        company: form.company || null,
        email: form.email || null,
        phone: form.phone || null,
        purpose: form.purpose || null,
        photoDataUrl: form.photoDataUrl || null,
      });
      setForm(blank());
      setErrors({});
      stopCam();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    stopCam();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-[720px] max-h-[93vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-[19px] font-medium">Register Visitor</DialogTitle>
          <p className="text-[12.5px] text-muted-foreground">A unique Visitor ID is issued on check-in</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Visitor Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {VISITOR_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => sf("type", t)}
                  className={cn(
                    "border-[1.5px] rounded-lg py-2.5 px-3 text-[11.5px] font-medium text-center transition-all cursor-pointer",
                    form.type === t
                      ? "bg-orange-50 border-orange-400 text-orange-700"
                      : "border-border hover:border-border/80 hover:bg-secondary text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Div>Basic Information</Div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Full Name" required error={errors.name}>
              <input className={iCls(!!errors.name)} value={form.name} placeholder="e.g. Rajesh Kumar"
                onChange={e => sf("name", e.target.value)} />
            </FormField>
            <FormField label="Company / Organisation">
              <input className={iCls(false)} value={form.company ?? ""} placeholder="e.g. Infosys Ltd"
                onChange={e => sf("company", e.target.value)} />
            </FormField>
            <FormField label="Email">
              <input className={iCls(false)} type="email" value={form.email ?? ""} placeholder="Optional"
                onChange={e => sf("email", e.target.value)} />
            </FormField>
            <FormField label="Phone">
              <input className={iCls(false)} value={form.phone ?? ""} placeholder="9876543210 (optional)"
                onChange={e => sf("phone", e.target.value)} />
            </FormField>
          </div>

          <Div>Point of Contact</Div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Host / Person Being Met" required error={errors.hostName}>
              <input className={iCls(!!errors.hostName)} value={form.hostName ?? ""} placeholder="Who they're meeting"
                onChange={e => sf("hostName", e.target.value)} />
            </FormField>
            <FormField label="Purpose of Visit">
              <input className={iCls(false)} value={form.purpose ?? ""} placeholder="Brief description"
                onChange={e => sf("purpose", e.target.value)} />
            </FormField>
          </div>

          <Div>Photo (optional)</Div>
          <div className="space-y-2">
            <div
              className="border-[1.5px] border-dashed border-border rounded-lg aspect-[4/3] max-h-[220px] flex items-center justify-center relative overflow-hidden bg-secondary cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => !camActive && !form.photoDataUrl && startCam()}
            >
              {form.photoDataUrl && (
                <img src={form.photoDataUrl} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />
              )}
              {camActive && (
                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
              )}
              {!form.photoDataUrl && !camActive && (
                <div className="flex flex-col items-center gap-2 text-muted-foreground z-10">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-7 h-7 opacity-40">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span className="text-xs">Click to open camera</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {!camActive && !form.photoDataUrl && (
                <button type="button" onClick={startCam} className="btn-ghost">
                  Open Camera
                </button>
              )}
              {camActive && (
                <>
                  <button type="button" onClick={capture} className="btn-primary">Capture</button>
                  <button type="button" onClick={stopCam} className="btn-ghost">Cancel</button>
                </>
              )}
              {form.photoDataUrl && (
                <button type="button" onClick={() => sf("photoDataUrl", null)} className="btn-ghost">Retake</button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button type="button" onClick={handleClose} className="btn-ghost">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving} className="btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {saving ? "Registering…" : "Issue ID & Check In"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Div({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold pb-2 border-b border-border mt-1">
      {children}
    </div>
  );
}

function FormField({ label, required, error, children, className }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-red-500">{error}</p>
      )}
    </div>
  );
}

function iCls(hasError: boolean) {
  return cn(
    "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[13.5px] text-foreground font-sans transition-all outline-none appearance-none",
    "focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/10",
    "placeholder:text-muted-foreground/60",
    hasError && "border-red-400",
  );
}
