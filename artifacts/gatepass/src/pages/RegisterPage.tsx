import { useState, useRef, useCallback } from "react";
import { VISITOR_TYPES } from "@/types";
import type { VisitorType } from "@/types";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export function RegisterPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    type: "Guest" as VisitorType,
    hostName: "",
    purpose: "",
    photo: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [camActive, setCamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const sf = (k: string, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
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
    sf("photo", c.toDataURL("image/jpeg"));
    stopCam();
  }, [stopCam]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.hostName.trim()) e.hostName = "Required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch(`${BASE}/api/public/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          company: form.company.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          type: form.type,
          host: form.hostName.trim(),
          purpose: form.purpose.trim() || undefined,
          photoUrl: form.photo || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Error ${res.status}`);
      }
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Submission failed. Please try again.");
      setStatus("error");
    }
  };

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
              <rect x="3" y="4" width="14" height="10" rx="2"/>
              <path d="M7 8h6M7 11h4"/>
              <rect x="7" y="17" width="10" height="3" rx="1.5"/>
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

          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[12.5px] text-red-700 mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Visit Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {VISITOR_TYPES.filter(t => t !== "Employee (Forgot ID)").map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => sf("type", t)}
                    className={cn(
                      "border-[1.5px] rounded-lg py-2 px-2 text-[11px] font-medium text-center transition-all cursor-pointer",
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

            <PField label="Full Name" required error={errors.name}>
              <input className={iCls(!!errors.name)} value={form.name} placeholder="Your full name" onChange={e => sf("name", e.target.value)} />
            </PField>

            <PField label="Company / Organisation">
              <input className={iCls(false)} value={form.company} placeholder="Optional" onChange={e => sf("company", e.target.value)} />
            </PField>

            <div className="grid grid-cols-2 gap-3">
              <PField label="Email">
                <input className={iCls(false)} type="email" value={form.email} placeholder="Optional" onChange={e => sf("email", e.target.value)} />
              </PField>
              <PField label="Phone">
                <input className={iCls(false)} value={form.phone} placeholder="Optional" onChange={e => sf("phone", e.target.value)} />
              </PField>
            </div>

            <PField label="Person You're Meeting" required error={errors.hostName}>
              <input className={iCls(!!errors.hostName)} value={form.hostName} placeholder="Name of your host" onChange={e => sf("hostName", e.target.value)} />
            </PField>

            <PField label="Purpose of Visit">
              <input className={iCls(false)} value={form.purpose} placeholder="Briefly describe your visit" onChange={e => sf("purpose", e.target.value)} />
            </PField>

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
                  <button type="button" onClick={capture} className="text-[11.5px] font-bold bg-primary text-white px-3 py-1.5 rounded-lg">Capture</button>
                  <button type="button" onClick={stopCam} className="btn-ghost">Cancel</button>
                </>}
                {form.photo && <button type="button" onClick={() => sf("photo", "")} className="btn-ghost">Retake</button>}
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
