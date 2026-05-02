import { useState, useRef, useCallback, useEffect } from "react";
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
  jobId?: string | null;
  interviewRound?: string | null;
  vehicleNumber?: string | null;
  employeeId?: string | null;
  department?: string | null;
  contractRef?: string | null;
  serviceType?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  homeOffice?: string | null;
  visitAgenda?: string | null;
  relationship?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewVisitorData) => Promise<void>;
}

type HostLabel = { label: string; placeholder: string };

const HOST_CONFIG: Partial<Record<VisitorType, HostLabel>> = {
  "Guest":               { label: "Host / Person Being Met", placeholder: "Who they're meeting" },
  "Vendor":              { label: "Contact Person", placeholder: "Internal contact name" },
  "Contractor":          { label: "Project Manager / Supervisor", placeholder: "Internal supervisor" },
  "Interview Candidate": { label: "Interviewer / HR Contact", placeholder: "Interviewer name" },
  "Delivery":            { label: "Recipient Name", placeholder: "Who receives the delivery" },
  "Government Official": { label: "Meeting With", placeholder: "Department / person" },
  "Leadership Visit":    { label: "Host Executive", placeholder: "Senior contact being met" },
  "Employee (Forgot ID)": { label: "Reporting Manager", placeholder: "Manager name" },
  "Other":               { label: "Host / Person Being Met", placeholder: "Who they're meeting" },
};

function blank(): NewVisitorData {
  return {
    name: "", company: "", email: "", phone: "",
    type: "Guest", hostName: "", purpose: "", photoDataUrl: undefined,
    jobId: "", interviewRound: "", vehicleNumber: "", employeeId: "",
    department: "", contractRef: "", serviceType: "", idType: "",
    idNumber: "", homeOffice: "", visitAgenda: "", relationship: "",
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
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } });
      streamRef.current = s;
      setCamActive(true);
    } catch {
      alert("Camera access denied or not available");
    }
  }, []);

  useEffect(() => {
    if (camActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [camActive]);

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamActive(false);
  }, []);

  const capture = useCallback(() => {
    if (!videoRef.current) return;
    const c = document.createElement("canvas");
    c.width = videoRef.current.videoWidth || 640;
    c.height = videoRef.current.videoHeight || 480;
    c.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    sf("photoDataUrl", c.toDataURL("image/jpeg", 0.85));
    stopCam();
  }, [stopCam]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    const hostCfg = HOST_CONFIG[form.type];
    if (hostCfg && !form.hostName?.trim()) e.hostName = `${hostCfg.label} is required`;
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
        jobId: form.jobId || null,
        interviewRound: form.interviewRound || null,
        vehicleNumber: form.vehicleNumber || null,
        employeeId: form.employeeId || null,
        department: form.department || null,
        contractRef: form.contractRef || null,
        serviceType: form.serviceType || null,
        idType: form.idType || null,
        idNumber: form.idNumber || null,
        homeOffice: form.homeOffice || null,
        visitAgenda: form.visitAgenda || null,
        relationship: form.relationship || null,
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
    setForm(blank());
    setErrors({});
    onClose();
  };

  const hostCfg = HOST_CONFIG[form.type] ?? HOST_CONFIG["Guest"]!;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-[740px] max-h-[93vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-semibold text-[19px] tracking-tight">Register Visitor</DialogTitle>
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
                  onClick={() => { sf("type", t); setErrors({}); }}
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

            {form.type !== "Employee (Forgot ID)" && (
              <FormField label="Company / Organisation">
                <input className={iCls(false)} value={form.company ?? ""} placeholder="e.g. Infosys Ltd"
                  onChange={e => sf("company", e.target.value)} />
              </FormField>
            )}

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
            <FormField label={hostCfg.label} required error={errors.hostName}>
              <input className={iCls(!!errors.hostName)} value={form.hostName ?? ""} placeholder={hostCfg.placeholder}
                onChange={e => sf("hostName", e.target.value)} />
            </FormField>
            <FormField label="Purpose of Visit">
              <input className={iCls(false)} value={form.purpose ?? ""} placeholder="Brief description"
                onChange={e => sf("purpose", e.target.value)} />
            </FormField>
          </div>

          {(form.type === "Vendor" || form.type === "Contractor") && (
            <>
              <Div>Contract Details</Div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Contract / PO Reference">
                  <input className={iCls(false)} value={form.contractRef ?? ""} placeholder="e.g. PO-2025-0042"
                    onChange={e => sf("contractRef", e.target.value)} />
                </FormField>
                <FormField label="Service Type">
                  <input className={iCls(false)} value={form.serviceType ?? ""} placeholder="e.g. IT Services, Civil"
                    onChange={e => sf("serviceType", e.target.value)} />
                </FormField>
              </div>
            </>
          )}

          {form.type === "Interview Candidate" && (
            <>
              <Div>Interview Details</Div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Job ID / Position">
                  <input className={iCls(false)} value={form.jobId ?? ""} placeholder="e.g. SWE-2025-047"
                    onChange={e => sf("jobId", e.target.value)} />
                </FormField>
                <FormField label="Interview Round">
                  <input className={iCls(false)} value={form.interviewRound ?? ""} placeholder="e.g. Round 2 — Technical"
                    onChange={e => sf("interviewRound", e.target.value)} />
                </FormField>
              </div>
            </>
          )}

          {form.type === "Delivery" && (
            <>
              <Div>Delivery Details</Div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Vehicle / Courier Number">
                  <input className={iCls(false)} value={form.vehicleNumber ?? ""} placeholder="e.g. TS09EF1234 or AWB#"
                    onChange={e => sf("vehicleNumber", e.target.value)} />
                </FormField>
              </div>
            </>
          )}

          {form.type === "Government Official" && (
            <>
              <Div>Official ID</Div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="ID Type">
                  <select className={iCls(false)} value={form.idType ?? ""} onChange={e => sf("idType", e.target.value)}>
                    <option value="">Select…</option>
                    <option>Aadhaar</option>
                    <option>PAN</option>
                    <option>Passport</option>
                    <option>Govt. ID Card</option>
                    <option>Other</option>
                  </select>
                </FormField>
                <FormField label="ID Number">
                  <input className={iCls(false)} value={form.idNumber ?? ""} placeholder="Document number"
                    onChange={e => sf("idNumber", e.target.value)} />
                </FormField>
              </div>
            </>
          )}

          {form.type === "Leadership Visit" && (
            <>
              <Div>Visit Details</Div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Home Office">
                  <input className={iCls(false)} value={form.homeOffice ?? ""} placeholder="e.g. HQ Mumbai"
                    onChange={e => sf("homeOffice", e.target.value)} />
                </FormField>
                <FormField label="Visit Agenda">
                  <input className={iCls(false)} value={form.visitAgenda ?? ""} placeholder="e.g. Q3 Business Review"
                    onChange={e => sf("visitAgenda", e.target.value)} />
                </FormField>
              </div>
            </>
          )}

          {form.type === "Employee (Forgot ID)" && (
            <>
              <Div>Employee Details</Div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Employee ID">
                  <input className={iCls(false)} value={form.employeeId ?? ""} placeholder="e.g. EMP-10087"
                    onChange={e => sf("employeeId", e.target.value)} />
                </FormField>
                <FormField label="Department">
                  <input className={iCls(false)} value={form.department ?? ""} placeholder="e.g. Engineering"
                    onChange={e => sf("department", e.target.value)} />
                </FormField>
              </div>
            </>
          )}

          {form.type === "Guest" && (
            <>
              <Div>Guest Details</Div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Relationship to Host">
                  <input className={iCls(false)} value={form.relationship ?? ""} placeholder="e.g. Client, Family, Friend"
                    onChange={e => sf("relationship", e.target.value)} />
                </FormField>
              </div>
            </>
          )}

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
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {!form.photoDataUrl && !camActive && (
                <div className="flex flex-col items-center gap-2 text-muted-foreground z-10 pointer-events-none">
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
                <button type="button" onClick={startCam} className="btn-ghost text-[12.5px]">
                  Open Camera
                </button>
              )}
              {camActive && (
                <>
                  <button type="button" onClick={capture} className="btn-primary text-[12.5px]">Capture Photo</button>
                  <button type="button" onClick={stopCam} className="btn-ghost text-[12.5px]">Cancel</button>
                </>
              )}
              {form.photoDataUrl && (
                <button type="button" onClick={() => { sf("photoDataUrl", null); }} className="btn-ghost text-[12.5px]">Retake</button>
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
