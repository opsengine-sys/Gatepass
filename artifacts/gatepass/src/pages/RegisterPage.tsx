import { useState, useRef, useCallback } from "react";
import { VISITOR_TYPES, POC_CFG, NEEDS_PURPOSE, NEEDS_COMPANY, OFFICES } from "@/types";
import type { VisitorType } from "@/types";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success";

export function RegisterPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({
    name: "", company: "", email: "", phone: "", type: "vendor" as VisitorType,
    office: OFFICES[0], host: "", hostPhone: "", purpose: "", photo: "",
    employeeId: "", department: "", jobId: "", interviewRound: "",
    relationship: "", homeOffice: "", visitAgenda: "", contractRef: "", serviceType: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [camActive, setCamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const sf = (k: string, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => { const n = {...prev}; delete n[k]; return n; });
  };

  const startCam = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
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
    sf("photo", c.toDataURL("image/jpeg"));
    stopCam();
  }, [stopCam]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (NEEDS_COMPANY[form.type] && !form.company.trim()) e.company = "Required";
    if (NEEDS_PURPOSE[form.type] && !form.purpose.trim()) e.purpose = "Required";
    const poc = POC_CFG[form.type];
    if (poc.show && !form.host.trim()) e.host = "Required";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    setStatus("submitting");
    setTimeout(() => {
      const raw = localStorage.getItem("gatepass_state");
      const state = raw ? JSON.parse(raw) : { visitors: [], gatePasses: [], logs: [], gpLogs: [] };
      const vid = `VID-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const newVisitor = {
        ...form,
        id: Math.random().toString(36).slice(2, 9),
        visitorId: vid,
        status: "pending",
        checkin: new Date().toISOString(),
        onBreak: false,
        breaks: [],
      };
      state.visitors.push(newVisitor);
      localStorage.setItem("gatepass_state", JSON.stringify(state));
      setStatus("success");
    }, 800);
  };

  const poc = POC_CFG[form.type];
  const showCompany = NEEDS_COMPANY[form.type];
  const showPurpose = NEEDS_PURPOSE[form.type];

  if (status === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-5">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#1a7a4a" strokeWidth="2.5" className="w-7 h-7">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="font-serif text-[21px] font-medium text-foreground mb-1">Registration Submitted</h2>
          <p className="text-[13px] text-muted-foreground mb-5">
            Your details have been received. Please show this confirmation at the gate. You'll be assigned a Visitor ID on arrival.
          </p>
          <div className="bg-secondary border border-border rounded-xl p-4 text-left">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Name</div>
            <div className="text-[15px] font-bold text-foreground">{form.name}</div>
          </div>
          <div className="mt-4 text-[11.5px] text-muted-foreground">
            Need to change something?{" "}
            <button className="text-primary font-semibold" onClick={() => setStatus("idle")}>Go back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="w-4 h-4">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <div className="font-bold text-[14px] text-foreground">GatePass</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Visitor Pre-Registration</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h1 className="font-serif text-[21px] font-medium text-foreground mb-0.5">Register Your Visit</h1>
          <p className="text-[12.5px] text-muted-foreground mb-5">Fill in your details before arriving. You'll get a Visitor ID at the gate.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Visit Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {VISITOR_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => sf("type", t.id)}
                    className={cn(
                      "border-[1.5px] rounded-lg py-2 px-2 text-[11.5px] font-medium text-center transition-all cursor-pointer",
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

            <PField label="Full Name" required error={errors.name}>
              <input className={iCls(!!errors.name)} value={form.name} placeholder="Your full name" onChange={e => sf("name", e.target.value)} />
            </PField>
            {showCompany && (
              <PField label="Company" required={NEEDS_COMPANY[form.type]} error={errors.company}>
                <input className={iCls(!!errors.company)} value={form.company} placeholder="Your company" onChange={e => sf("company", e.target.value)} />
              </PField>
            )}
            <div className="grid grid-cols-2 gap-3">
              <PField label="Email">
                <input className={iCls(false)} type="email" value={form.email} placeholder="Optional" onChange={e => sf("email", e.target.value)} />
              </PField>
              <PField label="Phone">
                <input className={iCls(false)} value={form.phone} placeholder="Optional" onChange={e => sf("phone", e.target.value)} />
              </PField>
            </div>
            <PField label="Office You're Visiting">
              <select className={iCls(false)} value={form.office} onChange={e => sf("office", e.target.value)}>
                {OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </PField>
            {poc.show && (
              <div className="grid grid-cols-2 gap-3">
                <PField label={poc.hostLabel ?? "Host"} required error={errors.host}>
                  <input className={iCls(!!errors.host)} value={form.host} placeholder="Who you're meeting" onChange={e => sf("host", e.target.value)} />
                </PField>
                <PField label={poc.phoneLabel ?? "Host Phone"}>
                  <input className={iCls(false)} value={form.hostPhone} placeholder="Optional" onChange={e => sf("hostPhone", e.target.value)} />
                </PField>
              </div>
            )}
            {showPurpose && (
              <PField label="Purpose of Visit" required error={errors.purpose}>
                <input className={iCls(!!errors.purpose)} value={form.purpose} placeholder="Briefly describe your visit" onChange={e => sf("purpose", e.target.value)} />
              </PField>
            )}
            {form.type === "employee" && (
              <PField label="Employee ID">
                <input className={iCls(false)} value={form.employeeId} placeholder="e.g. EMP-10042" onChange={e => sf("employeeId", e.target.value)} />
              </PField>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Photo (optional)</label>
              <div
                className="border-[1.5px] border-dashed border-border rounded-lg aspect-[4/3] max-h-[180px] flex items-center justify-center relative overflow-hidden bg-secondary cursor-pointer"
                onClick={() => !camActive && !form.photo && startCam()}
              >
                {form.photo && <img src={form.photo} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />}
                {camActive && <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />}
                {!form.photo && !camActive && (
                  <span className="text-[12px] text-muted-foreground">Click to take photo</span>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                {camActive && <>
                  <button type="button" onClick={capture} className="btn-primary-sm">Capture</button>
                  <button type="button" onClick={stopCam} className="btn-ghost-sm">Cancel</button>
                </>}
                {form.photo && <button type="button" onClick={() => sf("photo", "")} className="btn-ghost-sm">Retake</button>}
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full btn-primary py-3 text-[14px] justify-center"
            >
              {status === "submitting" ? "Submitting…" : "Submit Registration"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function PField({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
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
    "focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/10",
    "placeholder:text-muted-foreground/60",
    err && "border-red-400",
  );
}
