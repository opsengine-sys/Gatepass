import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { VISITOR_TYPES, POC_CFG, NEEDS_PURPOSE, NEEDS_COMPANY, OFFICES } from "@/types";
import type { Visitor, VisitorType } from "@/types";
import { genVID } from "@/hooks/useAppState";
import { cn } from "@/lib/utils";

type FormData = Omit<Visitor, "id" | "visitorId" | "status" | "checkin" | "checkout" | "onBreak" | "breaks">;

function blankForm(office: string): FormData {
  return {
    name: "", company: "", email: "", phone: "", type: "vendor" as VisitorType,
    office, host: "", hostPhone: "", purpose: "", address: "",
    photo: undefined, contractRef: "", serviceType: "",
    jobId: "", interviewRound: "", relationship: "",
    homeOffice: "", visitAgenda: "", employeeId: "", department: "",
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (visitor: Visitor) => void;
  currentOffice: string;
}

export function RegisterVisitorModal({ open, onClose, onSubmit, currentOffice }: Props) {
  const [form, setForm] = useState<FormData>(() => blankForm(currentOffice));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [camActive, setCamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const sf = (k: keyof FormData, v: unknown) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => { const n = {...prev}; delete n[k as string]; return n; });
  };

  const startCam = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; }
      setCamActive(true);
    } catch { alert("Camera access denied"); }
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
    const data = c.toDataURL("image/jpeg");
    sf("photo", data);
    stopCam();
  }, [stopCam]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (NEEDS_COMPANY[form.type] && !form.company?.trim()) e.company = "Company is required";
    if (NEEDS_PURPOSE[form.type] && !form.purpose?.trim()) e.purpose = "Purpose is required";
    const poc = POC_CFG[form.type];
    if (poc.show && !form.host?.trim()) e.host = "Host name is required";
    if (form.type === "employee" && !form.employeeId?.trim()) e.employeeId = "Employee ID is required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const vid = genVID();
    const now = new Date().toISOString();
    const visitor: Visitor = {
      ...form,
      id: Math.random().toString(36).slice(2, 9),
      visitorId: vid,
      status: "checked-in",
      checkin: now,
      onBreak: false,
      breaks: [],
    };
    onSubmit(visitor);
    setForm(blankForm(currentOffice));
    setErrors({});
    onClose();
  };

  const poc = POC_CFG[form.type];
  const showCompany = NEEDS_COMPANY[form.type];
  const showPurpose = NEEDS_PURPOSE[form.type];

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { stopCam(); onClose(); } }}>
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
                  key={t.id}
                  type="button"
                  onClick={() => sf("type", t.id)}
                  className={cn(
                    "border-[1.5px] rounded-lg py-2.5 px-3 text-[12.5px] font-medium text-center transition-all cursor-pointer",
                    form.type === t.id
                      ? "bg-orange-50 border-orange-400 text-orange-700"
                      : "border-border hover:border-border/80 hover:bg-secondary text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <SectionDivider>Basic Information</SectionDivider>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Full Name" required error={errors.name}>
              <input className={inputCls(!!errors.name)} value={form.name} placeholder="e.g. Rajesh Kumar"
                onChange={e => sf("name", e.target.value)} />
            </FormField>
            {showCompany && (
              <FormField label={form.type === "employee" ? "Department / Employer" : "Company"} required={NEEDS_COMPANY[form.type]} error={errors.company}>
                <input className={inputCls(!!errors.company)} value={form.company ?? ""} placeholder="e.g. Infosys Ltd"
                  onChange={e => sf("company", e.target.value)} />
              </FormField>
            )}
            <FormField label="Email">
              <input className={inputCls(false)} type="email" value={form.email ?? ""} placeholder="optional"
                onChange={e => sf("email", e.target.value)} />
            </FormField>
            <FormField label="Phone">
              <input className={inputCls(false)} value={form.phone ?? ""} placeholder="9876543210 (optional)"
                onChange={e => sf("phone", e.target.value)} />
            </FormField>
            <FormField label="Office">
              <select className={inputCls(false)} value={form.office} onChange={e => sf("office", e.target.value)}>
                {OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </FormField>
          </div>

          {poc.show && (
            <>
              <SectionDivider>Point of Contact</SectionDivider>
              <div className="grid grid-cols-2 gap-3">
                <FormField label={poc.hostLabel ?? "Host"} required error={errors.host}>
                  <input className={inputCls(!!errors.host)} value={form.host ?? ""} placeholder="Host name"
                    onChange={e => sf("host", e.target.value)} />
                </FormField>
                <FormField label={poc.phoneLabel ?? "Host Phone"}>
                  <input className={inputCls(false)} value={form.hostPhone ?? ""} placeholder="optional"
                    onChange={e => sf("hostPhone", e.target.value)} />
                </FormField>
              </div>
            </>
          )}

          {(showPurpose || form.type !== "employee") && (
            <>
              <SectionDivider>Visit Details</SectionDivider>
              <div className="grid grid-cols-2 gap-3">
                {showPurpose && (
                  <FormField label="Purpose of Visit" required={showPurpose} error={errors.purpose} className="col-span-2">
                    <input className={inputCls(!!errors.purpose)} value={form.purpose ?? ""} placeholder="Brief description of visit"
                      onChange={e => sf("purpose", e.target.value)} />
                  </FormField>
                )}
                <FormField label="Address / Location">
                  <input className={inputCls(false)} value={form.address ?? ""} placeholder="optional"
                    onChange={e => sf("address", e.target.value)} />
                </FormField>
                {form.type === "vendor" && <>
                  <FormField label="Contract / PO Reference">
                    <input className={inputCls(false)} value={form.contractRef ?? ""} placeholder="e.g. PO-2025-0042" onChange={e => sf("contractRef", e.target.value)} />
                  </FormField>
                  <FormField label="Service Category">
                    <input className={inputCls(false)} value={form.serviceType ?? ""} placeholder="e.g. IT Hardware" onChange={e => sf("serviceType", e.target.value)} />
                  </FormField>
                </>}
                {form.type === "candidate" && <>
                  <FormField label="Job ID / Role Applied">
                    <input className={inputCls(false)} value={form.jobId ?? ""} placeholder="e.g. SWE-2025-047" onChange={e => sf("jobId", e.target.value)} />
                  </FormField>
                  <FormField label="Interview Round">
                    <input className={inputCls(false)} value={form.interviewRound ?? ""} placeholder="e.g. Round 2 — Technical" onChange={e => sf("interviewRound", e.target.value)} />
                  </FormField>
                </>}
                {form.type === "guest" && (
                  <FormField label="Relationship to Host">
                    <input className={inputCls(false)} value={form.relationship ?? ""} placeholder="e.g. Family, Friend" onChange={e => sf("relationship", e.target.value)} />
                  </FormField>
                )}
                {form.type === "leadership" && <>
                  <FormField label="Home Office / BU">
                    <input className={inputCls(false)} value={form.homeOffice ?? ""} placeholder="e.g. iCIMS New Jersey HQ" onChange={e => sf("homeOffice", e.target.value)} />
                  </FormField>
                  <FormField label="Visit Agenda" className="col-span-2">
                    <input className={inputCls(false)} value={form.visitAgenda ?? ""} placeholder="e.g. Q3 Business Review" onChange={e => sf("visitAgenda", e.target.value)} />
                  </FormField>
                </>}
                {form.type === "employee" && <>
                  <FormField label="Employee ID" required error={errors.employeeId}>
                    <input className={inputCls(!!errors.employeeId)} value={form.employeeId ?? ""} placeholder="e.g. EMP-10042" onChange={e => sf("employeeId", e.target.value)} />
                  </FormField>
                  <FormField label="Department">
                    <input className={inputCls(false)} value={form.department ?? ""} placeholder="e.g. Engineering" onChange={e => sf("department", e.target.value)} />
                  </FormField>
                </>}
              </div>
            </>
          )}

          <SectionDivider>Photo</SectionDivider>
          <div className="space-y-2">
            <div
              className="border-[1.5px] border-dashed border-border rounded-lg aspect-[4/3] max-h-[220px] flex items-center justify-center relative overflow-hidden bg-secondary cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => !camActive && !form.photo && startCam()}
            >
              {form.photo && (
                <img src={form.photo} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />
              )}
              {camActive && (
                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
              )}
              {!form.photo && !camActive && (
                <div className="flex flex-col items-center gap-2 text-muted-foreground z-10">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-7 h-7 opacity-40">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span className="text-xs">Click to open camera</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {!camActive && !form.photo && (
                <button type="button" onClick={startCam} className="btn-ghost-sm">
                  <CamIcon /> Open Camera
                </button>
              )}
              {camActive && <>
                <button type="button" onClick={capture} className="btn-primary-sm">
                  <CamIcon /> Capture
                </button>
                <button type="button" onClick={stopCam} className="btn-ghost-sm">Cancel</button>
              </>}
              {form.photo && (
                <button type="button" onClick={() => sf("photo", undefined)} className="btn-ghost-sm">
                  Retake
                </button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="button" onClick={handleSubmit} className="btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Issue ID & Check In
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectionDivider({ children }: { children: React.ReactNode }) {
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
        <p className="text-[11px] text-red-500 flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </p>
      )}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[13.5px] text-foreground font-sans transition-all outline-none appearance-none",
    "focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/10",
    "placeholder:text-muted-foreground/60",
    hasError && "border-red-400",
    "[&[type=select]]:appearance-none"
  );
}

function CamIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}
