import { useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useUser } from "@clerk/react";
import { useBranding } from "@/contexts/BrandingContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { VISITOR_TYPES, TYPE_COLORS, GP_TYPES } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOffices, useCreateOffice, useUpdateOffice, useDeleteOffice,
  useListUsers, useUpdateUser,
} from "@workspace/api-client-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsTab = "profile" | "customization" | "badge-templates" | "team" | "locations" | "notifications" | "integrations" | "appearance";
type IntegSub = "sso" | "messaging" | "webhooks" | "api-keys";
type MsgChannel = "email" | "whatsapp" | "sms";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { id: SettingsTab; label: string; adminOnly?: boolean }[] = [
  { id: "profile", label: "Profile" },
  { id: "customization", label: "Customization", adminOnly: true },
  { id: "badge-templates", label: "Badge Templates" },
  { id: "team", label: "Team & Users", adminOnly: true },
  { id: "locations", label: "Locations", adminOnly: true },
  { id: "notifications", label: "Notifications" },
  { id: "integrations", label: "Integrations", adminOnly: true },
  { id: "appearance", label: "Appearance" },
];

const BADGE_TEMPLATES = [
  { id: "classic", label: "Classic", desc: "Centered layout with photo circle and colored strip" },
  { id: "minimal", label: "Minimal", desc: "Text-focused, compact, monochrome" },
  { id: "bold", label: "Bold", desc: "Large ID emphasis with accent colors" },
];

const GP_TEMPLATES = [
  { id: "minimal", label: "Minimal", desc: "Clean compact card with item list" },
  { id: "detailed", label: "Detailed A4", desc: "Full A4 grid — all fields, print-ready" },
  { id: "compact", label: "Compact", desc: "Condensed single-column layout" },
];

const NOTIFICATION_TOGGLES = [
  { id: "checkin", label: "Visitor Check-in", desc: "Alert when a visitor checks in" },
  { id: "checkout", label: "Visitor Check-out", desc: "Alert when a visitor checks out" },
  { id: "gp_created", label: "Gate Pass Created", desc: "Alert when a new gate pass is issued" },
  { id: "gp_closed", label: "Gate Pass Closed", desc: "Alert when a gate pass is closed" },
  { id: "daily_summary", label: "Daily Summary", desc: "End-of-day visitor & pass report" },
  { id: "new_user", label: "New Team Member", desc: "Alert when someone joins the workspace" },
];

const FONTS = [
  "Plus Jakarta Sans", "Inter", "Poppins", "DM Sans", "Nunito",
  "Raleway", "Montserrat", "Source Sans 3", "Lato", "Rubik",
];

const COLOR_SWATCHES = [
  "#c06b2c", "#1e7d3a", "#1a5fa8", "#6b3fa0",
  "#176878", "#8a6a0a", "#c0392b", "#374151",
  "#0f766e", "#9d174d", "#7c3aed", "#0369a1",
];

const VISITOR_FORM_FIELDS = [
  { id: "phone", label: "Phone Number", category: "contact" },
  { id: "email", label: "Email Address", category: "contact" },
  { id: "company", label: "Company / Organisation", category: "contact" },
  { id: "host", label: "Host Name", category: "visit" },
  { id: "purpose", label: "Purpose of Visit", category: "visit" },
  { id: "idType", label: "ID Type", category: "identity" },
  { id: "idNumber", label: "ID Number", category: "identity" },
  { id: "vehicle", label: "Vehicle Number", category: "vehicle" },
  { id: "photo", label: "Photo Capture", category: "identity" },
  { id: "expectedCheckout", label: "Expected Checkout Time", category: "visit" },
];

const GP_FORM_FIELDS = [
  { id: "vendorName", label: "Vendor / Party Name", category: "party" },
  { id: "vehicleNo", label: "Vehicle Number", category: "vehicle" },
  { id: "driverName", label: "Driver Name", category: "vehicle" },
  { id: "notes", label: "Additional Notes", category: "other" },
];

const WEBHOOK_EVENTS = [
  { id: "visitor.checkin", label: "Visitor Check-in" },
  { id: "visitor.checkout", label: "Visitor Check-out" },
  { id: "visitor.registered", label: "Visitor Registered" },
  { id: "gatepass.created", label: "Gate Pass Created" },
  { id: "gatepass.closed", label: "Gate Pass Closed" },
  { id: "user.invited", label: "User Invited" },
  { id: "user.joined", label: "User Joined" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function Settings() {
  const { user } = useApp();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [badgeTemplate, setBadgeTemplate] = useState("classic");
  const [gpTemplate, setGpTemplate] = useState("minimal");
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    checkin: true, checkout: true, gp_created: true,
    gp_closed: false, daily_summary: false, new_user: true,
  });

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const visibleTabs = TABS.filter(t => !t.adminOnly || isAdmin);

  const toggleNotif = (id: string) => {
    setNotifications(prev => ({ ...prev, [id]: !prev[id] }));
    toast.success("Notification preference saved");
  };

  return (
    <div className="max-w-[900px]">
      <div className="mb-5">
        <h1 className="font-serif text-[21px] font-medium text-foreground">Settings</h1>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">Manage your workspace preferences and configuration</p>
      </div>

      <div className="flex gap-1 bg-secondary border border-border rounded-xl p-1 w-fit mb-6 flex-wrap">
        {visibleTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium transition-all",
              tab === t.id ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileTab user={user} isAdmin={isAdmin} />}
      {tab === "customization" && <CustomizationTab />}
      {tab === "badge-templates" && <BadgeTemplatesTab badgeTemplate={badgeTemplate} setBadgeTemplate={setBadgeTemplate} gpTemplate={gpTemplate} setGpTemplate={setGpTemplate} />}
      {tab === "team" && <TeamTab />}
      {tab === "locations" && <LocationsTab />}
      {tab === "notifications" && <NotificationsTab notifications={notifications} onToggle={toggleNotif} />}
      {tab === "integrations" && <IntegrationsTab />}
      {tab === "appearance" && <AppearanceTab />}
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab({ user, isAdmin }: { user: ReturnType<typeof useApp>["user"]; isAdmin: boolean }) {
  const { user: clerkUser } = useUser();
  const [name, setName] = useState(user?.name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [savingPw, setSavingPw] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    setSavingProfile(true);
    try {
      const parts = name.trim().split(" ");
      await clerkUser?.update({ firstName: parts[0], lastName: parts.slice(1).join(" ") || undefined });
      const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      await fetch(`${basePath}/api/me`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
      toast.success("Profile updated");
    } catch { toast.error("Failed to save profile"); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    const errs: Record<string, string> = {};
    if (!currentPw) errs.currentPw = "Current password is required";
    if (!newPw) errs.newPw = "New password is required";
    else if (newPw.length < 8) errs.newPw = "Must be at least 8 characters";
    if (!confirmPw) errs.confirmPw = "Please confirm your new password";
    else if (newPw !== confirmPw) errs.confirmPw = "Passwords do not match";
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwErrors({});
    setSavingPw(true);
    try {
      await clerkUser?.updatePassword({ currentPassword: currentPw, newPassword: newPw, signOutOfOtherSessions: false });
      toast.success("Password changed successfully");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: unknown) {
      const msg = (err as { errors?: Array<{ message: string }> })?.errors?.[0]?.message ?? "Failed to change password";
      toast.error(msg);
      if (msg.toLowerCase().includes("current")) setPwErrors({ currentPw: msg });
    } finally { setSavingPw(false); }
  };

  const passwordEnabled = clerkUser?.passwordEnabled ?? true;
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const lastSignIn = clerkUser?.lastSignInAt ? new Date(clerkUser.lastSignInAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";

  return (
    <div className="space-y-4">
      <Card title="Your Profile">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name">
            <input className={iCls} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Email">
            <div className="relative">
              <input className={cn(iCls, "pr-10")} value={user?.email ?? ""} readOnly style={{ opacity: 0.7, cursor: "not-allowed" }} />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
          </Field>
          <Field label="Role">
            <input className={iCls} value={formatRole(user?.role ?? "")} readOnly style={{ opacity: 0.7, cursor: "not-allowed" }} />
          </Field>
          <Field label="Company">
            <input className={iCls} value={user?.company?.name ?? "—"} readOnly style={{ opacity: 0.7, cursor: "not-allowed" }} />
          </Field>
          <Field label="Office">
            <input className={iCls} value={user?.office ? `${user.office.name} — ${user.office.city}` : "—"} readOnly style={{ opacity: 0.7, cursor: "not-allowed" }} />
          </Field>
          <Field label="Plan">
            <div className="flex items-center gap-2 h-[38px]">
              <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide", {
                "bg-amber-50 text-amber-700": user?.company?.plan === "enterprise",
                "bg-blue-50 text-blue-700": user?.company?.plan === "growth",
                "bg-secondary text-muted-foreground": user?.company?.plan === "starter" || !user?.company?.plan,
              })}>
                {user?.company?.plan ?? "Starter"}
              </span>
            </div>
          </Field>
        </div>
        <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-4 text-[12px] text-muted-foreground">
          <div>Member since <span className="font-medium text-foreground">{joinDate}</span></div>
          <div>Last sign-in <span className="font-medium text-foreground">{lastSignIn}</span></div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary">
            {savingProfile ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </Card>

      <Card title="Password & Security">
        {!passwordEnabled ? (
          <div className="flex items-start gap-3 py-1">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" className="w-4.5 h-4.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground mb-0.5">SSO / Passwordless Account</p>
              <p className="text-[12.5px] text-muted-foreground">Your account uses social sign-in and does not have a standalone password. Security is managed by your identity provider.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <PwField label="Current Password" value={currentPw} onChange={setCurrentPw} show={showCurrent} onToggle={() => setShowCurrent(p => !p)} error={pwErrors.currentPw} placeholder="Enter current password" />
            <div className="grid grid-cols-2 gap-3">
              <PwField label="New Password" value={newPw} onChange={setNewPw} show={showNew} onToggle={() => setShowNew(p => !p)} error={pwErrors.newPw} placeholder="Min. 8 characters" />
              <PwField label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} show={showConfirm} onToggle={() => setShowConfirm(p => !p)} error={pwErrors.confirmPw} placeholder="Repeat new password" />
            </div>
            {newPw && <PasswordStrength password={newPw} />}
            <div className="flex justify-end pt-1">
              <button onClick={handleChangePassword} disabled={savingPw} className="btn-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3.5 h-3.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                {savingPw ? "Updating…" : "Update Password"}
              </button>
            </div>
          </div>
        )}
      </Card>

      {isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-[12px] text-blue-700 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          As an admin, you can manage team members and configuration settings from the Team & Users and Customization tabs.
        </div>
      )}
    </div>
  );
}

// ─── Customization Tab ────────────────────────────────────────────────────────

type VisitorTypeItem = { id: string; name: string; color: string; enabled: boolean };
type GPTypeItem = { id: string; name: string; enabled: boolean };
type FieldConfig = Record<string, { enabled: boolean; required: boolean }>;
type CustomFieldItem = { id: string; label: string; enabled: boolean; required: boolean };

function loadVisitorTypes(): VisitorTypeItem[] {
  try { const s = localStorage.getItem("gp_vt_v1"); if (s) return JSON.parse(s); } catch { /* ignore */ }
  return VISITOR_TYPES.map((t, i) => ({ id: String(i), name: t, color: TYPE_COLORS[t] ?? "#445368", enabled: true }));
}
function loadGPTypes(): GPTypeItem[] {
  try { const s = localStorage.getItem("gp_gpt_v1"); if (s) return JSON.parse(s); } catch { /* ignore */ }
  return GP_TYPES.map((t, i) => ({ id: String(i), name: t, enabled: true }));
}
function loadVFields(): FieldConfig {
  try { const s = localStorage.getItem("gp_vfields_v1"); if (s) return JSON.parse(s); } catch { /* ignore */ }
  return Object.fromEntries(VISITOR_FORM_FIELDS.map(f => [f.id, { enabled: true, required: false }]));
}
function loadGPFields(): FieldConfig {
  try { const s = localStorage.getItem("gp_gpfields_v1"); if (s) return JSON.parse(s); } catch { /* ignore */ }
  return Object.fromEntries(GP_FORM_FIELDS.map(f => [f.id, { enabled: true, required: false }]));
}
function loadCustomVFields(): CustomFieldItem[] {
  try { const s = localStorage.getItem("gp_custom_vfields_v1"); if (s) return JSON.parse(s); } catch { /* ignore */ }
  return [];
}
function loadCustomGPFields(): CustomFieldItem[] {
  try { const s = localStorage.getItem("gp_custom_gpfields_v1"); if (s) return JSON.parse(s); } catch { /* ignore */ }
  return [];
}

function AccordionSection({ title, badge, children, defaultOpen = false, accent }: {
  title: string; badge?: string; children: React.ReactNode; defaultOpen?: boolean; accent?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/40 transition-colors text-left"
      >
        {accent && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />}
        <span className="font-bold text-[13px] text-foreground flex-1">{title}</span>
        {badge && (
          <span className="text-[10.5px] font-semibold bg-secondary border border-border px-2 py-0.5 rounded-full text-muted-foreground mr-2">
            {badge}
          </span>
        )}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", open && "rotate-180")}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="border-t border-border">{children}</div>}
    </div>
  );
}

function CustomizationTab() {
  const [vTypes, setVTypes] = useState<VisitorTypeItem[]>(loadVisitorTypes);
  const [gpTypes, setGPTypes] = useState<GPTypeItem[]>(loadGPTypes);
  const [vFields, setVFields] = useState<FieldConfig>(loadVFields);
  const [gpFields, setGPFields] = useState<FieldConfig>(loadGPFields);
  const [customVFields, setCustomVFields] = useState<CustomFieldItem[]>(loadCustomVFields);
  const [customGPFields, setCustomGPFields] = useState<CustomFieldItem[]>(loadCustomGPFields);
  const [newVType, setNewVType] = useState("");
  const [newGPType, setNewGPType] = useState("");
  const [newVFieldLabel, setNewVFieldLabel] = useState("");
  const [newGPFieldLabel, setNewGPFieldLabel] = useState("");

  const saveVT = (next: VisitorTypeItem[]) => { setVTypes(next); localStorage.setItem("gp_vt_v1", JSON.stringify(next)); };
  const saveGPT = (next: GPTypeItem[]) => { setGPTypes(next); localStorage.setItem("gp_gpt_v1", JSON.stringify(next)); };
  const saveVF = (next: FieldConfig) => { setVFields(next); localStorage.setItem("gp_vfields_v1", JSON.stringify(next)); };
  const saveGPF = (next: FieldConfig) => { setGPFields(next); localStorage.setItem("gp_gpfields_v1", JSON.stringify(next)); };
  const saveCVF = (next: CustomFieldItem[]) => { setCustomVFields(next); localStorage.setItem("gp_custom_vfields_v1", JSON.stringify(next)); };
  const saveCGPF = (next: CustomFieldItem[]) => { setCustomGPFields(next); localStorage.setItem("gp_custom_gpfields_v1", JSON.stringify(next)); };

  const addVType = () => {
    if (!newVType.trim()) return;
    saveVT([...vTypes, { id: Date.now().toString(), name: newVType.trim(), color: "#445368", enabled: true }]);
    setNewVType(""); toast.success("Visitor type added");
  };
  const addGPType = () => {
    if (!newGPType.trim()) return;
    saveGPT([...gpTypes, { id: Date.now().toString(), name: newGPType.trim(), enabled: true }]);
    setNewGPType(""); toast.success("Gate pass type added");
  };
  const addCustomVField = () => {
    if (!newVFieldLabel.trim()) return;
    saveCVF([...customVFields, { id: Date.now().toString(), label: newVFieldLabel.trim(), enabled: true, required: false }]);
    setNewVFieldLabel(""); toast.success("Custom field added");
  };
  const addCustomGPField = () => {
    if (!newGPFieldLabel.trim()) return;
    saveCGPF([...customGPFields, { id: Date.now().toString(), label: newGPFieldLabel.trim(), enabled: true, required: false }]);
    setNewGPFieldLabel(""); toast.success("Custom field added");
  };

  const toggleVField = (id: string, key: "enabled" | "required") => {
    const next = { ...vFields, [id]: { ...vFields[id], [key]: !vFields[id][key] } };
    saveVF(next);
  };
  const toggleGPField = (id: string, key: "enabled" | "required") => {
    const next = { ...gpFields, [id]: { ...gpFields[id], [key]: !gpFields[id][key] } };
    saveGPF(next);
  };

  return (
    <div className="space-y-3">
      {/* Visitor Types */}
      <AccordionSection
        title="Visitor Types"
        badge={`${vTypes.filter(t => t.enabled).length} active`}
        accent="#c06b2c"
        defaultOpen
      >
        <div className="p-4 space-y-2">
          {vTypes.map(vt => (
            <div key={vt.id} className="flex items-center gap-2.5">
              <input
                type="color"
                value={vt.color}
                onChange={e => saveVT(vTypes.map(t => t.id === vt.id ? { ...t, color: e.target.value } : t))}
                className="w-7 h-7 rounded-lg cursor-pointer border border-border p-0.5 bg-transparent flex-shrink-0"
              />
              <input
                className={cn(iCls, "flex-1")}
                value={vt.name}
                onChange={e => saveVT(vTypes.map(t => t.id === vt.id ? { ...t, name: e.target.value } : t))}
                placeholder="Type name…"
              />
              <button
                onClick={() => saveVT(vTypes.map(t => t.id === vt.id ? { ...t, enabled: !t.enabled } : t))}
                className={cn("w-8 h-5 rounded-full relative transition-colors flex-shrink-0", vt.enabled ? "bg-primary" : "bg-border")}
              >
                <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all", vt.enabled ? "left-[14px]" : "left-0.5")} />
              </button>
              {vTypes.length > 2 && (
                <button
                  onClick={() => { saveVT(vTypes.filter(t => t.id !== vt.id)); toast.success("Type removed"); }}
                  className="text-muted-foreground/40 hover:text-destructive transition-colors flex-shrink-0"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-1 border-t border-border mt-3">
            <input
              className={cn(iCls, "flex-1")}
              value={newVType}
              onChange={e => setNewVType(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addVType()}
              placeholder="New visitor type name…"
            />
            <button onClick={addVType} className="btn-primary flex-shrink-0">Add</button>
          </div>
        </div>
      </AccordionSection>

      {/* Gate Pass Types */}
      <AccordionSection
        title="Gate Pass Types"
        badge={`${gpTypes.filter(t => t.enabled).length} active`}
        accent="#0d9488"
        defaultOpen
      >
        <div className="p-4 space-y-2">
          {gpTypes.map(gt => (
            <div key={gt.id} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              </div>
              <input
                className={cn(iCls, "flex-1")}
                value={gt.name}
                onChange={e => saveGPT(gpTypes.map(t => t.id === gt.id ? { ...t, name: e.target.value } : t))}
                placeholder="Type name…"
              />
              <button
                onClick={() => saveGPT(gpTypes.map(t => t.id === gt.id ? { ...t, enabled: !t.enabled } : t))}
                className={cn("w-8 h-5 rounded-full relative transition-colors flex-shrink-0", gt.enabled ? "bg-teal-600" : "bg-border")}
              >
                <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all", gt.enabled ? "left-[14px]" : "left-0.5")} />
              </button>
              {gpTypes.length > 2 && (
                <button
                  onClick={() => { saveGPT(gpTypes.filter(t => t.id !== gt.id)); toast.success("Type removed"); }}
                  className="text-muted-foreground/40 hover:text-destructive transition-colors flex-shrink-0"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-1 border-t border-border mt-3">
            <input
              className={cn(iCls, "flex-1")}
              value={newGPType}
              onChange={e => setNewGPType(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addGPType()}
              placeholder="New gate pass type name…"
            />
            <button onClick={addGPType} className="btn-primary flex-shrink-0 !bg-teal-600 hover:!bg-teal-700">Add</button>
          </div>
        </div>
      </AccordionSection>

      {/* Visitor Form Fields */}
      <AccordionSection
        title="Visitor Registration Form"
        badge={`${Object.values(vFields).filter(f => f.enabled).length + customVFields.filter(f => f.enabled).length} fields on`}
        accent="#3b82f6"
      >
        <div className="divide-y divide-border">
          <div className="grid grid-cols-[1fr_80px_80px_36px] gap-2 px-5 py-2.5 bg-secondary/50">
            <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide">Field</span>
            <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide text-center">Show</span>
            <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide text-center">Required</span>
            <span />
          </div>
          {VISITOR_FORM_FIELDS.map(f => {
            const cfg = vFields[f.id] ?? { enabled: true, required: false };
            return (
              <div key={f.id} className="grid grid-cols-[1fr_80px_80px_36px] gap-2 items-center px-5 py-3">
                <span className="text-[13px] text-foreground">{f.label}</span>
                <div className="flex justify-center"><Toggle checked={cfg.enabled} onChange={() => toggleVField(f.id, "enabled")} color="primary" /></div>
                <div className="flex justify-center"><Toggle checked={cfg.required && cfg.enabled} onChange={() => cfg.enabled && toggleVField(f.id, "required")} color="amber" disabled={!cfg.enabled} /></div>
                <div />
              </div>
            );
          })}
          {customVFields.map(f => (
            <div key={f.id} className="grid grid-cols-[1fr_80px_80px_36px] gap-2 items-center px-5 py-2.5">
              <input
                className={cn(iCls, "text-[13px]")}
                value={f.label}
                onChange={e => saveCVF(customVFields.map(x => x.id === f.id ? { ...x, label: e.target.value } : x))}
                placeholder="Field label…"
              />
              <div className="flex justify-center">
                <Toggle checked={f.enabled} onChange={() => saveCVF(customVFields.map(x => x.id === f.id ? { ...x, enabled: !x.enabled } : x))} color="primary" />
              </div>
              <div className="flex justify-center">
                <Toggle checked={f.required && f.enabled} onChange={() => f.enabled && saveCVF(customVFields.map(x => x.id === f.id ? { ...x, required: !x.required } : x))} color="amber" disabled={!f.enabled} />
              </div>
              <button onClick={() => { saveCVF(customVFields.filter(x => x.id !== f.id)); toast.success("Field removed"); }}
                className="text-muted-foreground/40 hover:text-destructive transition-colors flex justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          ))}
          <div className="flex gap-2 px-5 py-3 bg-secondary/30">
            <input
              className={cn(iCls, "flex-1 text-[13px]")}
              value={newVFieldLabel}
              onChange={e => setNewVFieldLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomVField()}
              placeholder="Add custom field label (e.g. Department, Badge No…)"
            />
            <button onClick={addCustomVField} className="btn-ghost flex-shrink-0 text-[12px]">+ Add Field</button>
          </div>
        </div>
      </AccordionSection>

      {/* Gate Pass Form Fields */}
      <AccordionSection
        title="Gate Pass Form"
        badge={`${Object.values(gpFields).filter(f => f.enabled).length + customGPFields.filter(f => f.enabled).length} fields on`}
        accent="#0d9488"
      >
        <div className="divide-y divide-border">
          <div className="grid grid-cols-[1fr_80px_80px_36px] gap-2 px-5 py-2.5 bg-secondary/50">
            <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide">Field</span>
            <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide text-center">Show</span>
            <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide text-center">Required</span>
            <span />
          </div>
          {GP_FORM_FIELDS.map(f => {
            const cfg = gpFields[f.id] ?? { enabled: true, required: false };
            return (
              <div key={f.id} className="grid grid-cols-[1fr_80px_80px_36px] gap-2 items-center px-5 py-3">
                <span className="text-[13px] text-foreground">{f.label}</span>
                <div className="flex justify-center"><Toggle checked={cfg.enabled} onChange={() => toggleGPField(f.id, "enabled")} color="teal" /></div>
                <div className="flex justify-center"><Toggle checked={cfg.required && cfg.enabled} onChange={() => cfg.enabled && toggleGPField(f.id, "required")} color="amber" disabled={!cfg.enabled} /></div>
                <div />
              </div>
            );
          })}
          {customGPFields.map(f => (
            <div key={f.id} className="grid grid-cols-[1fr_80px_80px_36px] gap-2 items-center px-5 py-2.5">
              <input
                className={cn(iCls, "text-[13px]")}
                value={f.label}
                onChange={e => saveCGPF(customGPFields.map(x => x.id === f.id ? { ...x, label: e.target.value } : x))}
                placeholder="Field label…"
              />
              <div className="flex justify-center">
                <Toggle checked={f.enabled} onChange={() => saveCGPF(customGPFields.map(x => x.id === f.id ? { ...x, enabled: !x.enabled } : x))} color="teal" />
              </div>
              <div className="flex justify-center">
                <Toggle checked={f.required && f.enabled} onChange={() => f.enabled && saveCGPF(customGPFields.map(x => x.id === f.id ? { ...x, required: !x.required } : x))} color="amber" disabled={!f.enabled} />
              </div>
              <button onClick={() => { saveCGPF(customGPFields.filter(x => x.id !== f.id)); toast.success("Field removed"); }}
                className="text-muted-foreground/40 hover:text-destructive transition-colors flex justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          ))}
          <div className="flex gap-2 px-5 py-3 bg-secondary/30">
            <input
              className={cn(iCls, "flex-1 text-[13px]")}
              value={newGPFieldLabel}
              onChange={e => setNewGPFieldLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomGPField()}
              placeholder="Add custom field label (e.g. Material, PO No…)"
            />
            <button onClick={addCustomGPField} className="btn-ghost flex-shrink-0 text-[12px]">+ Add Field</button>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
}

// ─── Badge Templates Tab ──────────────────────────────────────────────────────

function BadgeTemplatesTab({ badgeTemplate, setBadgeTemplate, gpTemplate, setGpTemplate }: {
  badgeTemplate: string; setBadgeTemplate: (t: string) => void;
  gpTemplate: string; setGpTemplate: (t: string) => void;
}) {
  return (
    <div className="space-y-5">
      <Card title="Visitor Badge Templates">
        <div className="grid grid-cols-3 gap-3">
          {BADGE_TEMPLATES.map(t => (
            <button key={t.id} onClick={() => { setBadgeTemplate(t.id); toast.success(`Badge template set to "${t.label}"`); }}
              className={cn("border-[1.5px] rounded-xl overflow-hidden text-left transition-all",
                badgeTemplate === t.id ? "border-primary shadow-[0_0_0_3px_rgba(192,107,44,0.15)]" : "border-border hover:border-primary/40")}>
              <div className={cn("h-[88px] flex items-center justify-center", badgeTemplate === t.id ? "bg-orange-50" : "bg-secondary")}>
                <BadgePreview id={t.id} active={badgeTemplate === t.id} />
              </div>
              <div className="px-3 py-2.5 border-t border-border">
                <div className="text-[12.5px] font-semibold text-foreground flex items-center gap-1.5">
                  {t.label}
                  {badgeTemplate === t.id && <span className="text-[10px] bg-orange-100 text-orange-700 rounded-full px-1.5 py-0.5 font-bold">Active</span>}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Gate Pass Templates">
        <div className="grid grid-cols-3 gap-3">
          {GP_TEMPLATES.map(t => (
            <button key={t.id} onClick={() => { setGpTemplate(t.id); toast.success(`Gate pass template set to "${t.label}"`); }}
              className={cn("border-[1.5px] rounded-xl overflow-hidden text-left transition-all",
                gpTemplate === t.id ? "border-teal-500 shadow-[0_0_0_3px_rgba(20,184,166,0.12)]" : "border-border hover:border-teal-400/40")}>
              <div className={cn("h-[88px] flex items-center justify-center", gpTemplate === t.id ? "bg-teal-50" : "bg-secondary")}>
                <GPPreview id={t.id} active={gpTemplate === t.id} />
              </div>
              <div className="px-3 py-2.5 border-t border-border">
                <div className="text-[12.5px] font-semibold text-foreground flex items-center gap-1.5">
                  {t.label}
                  {gpTemplate === t.id && <span className="text-[10px] bg-teal-50 text-teal-700 rounded-full px-1.5 py-0.5 font-bold">Active</span>}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-[11.5px] text-blue-700 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Gate passes use A4 size (210 × 297 mm) for easy printing with full details.
        </div>
      </Card>
    </div>
  );
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────

function TeamTab() {
  const { user } = useApp();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const handleInvite = () => {
    if (!inviteEmail.trim()) { toast.error("Enter an email address"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) { toast.error("Enter a valid email address"); return; }
    toast.success(`Invite sent to ${inviteEmail}`);
    setInviteEmail("");
  };
  return (
    <div className="space-y-4">
      <Card title="Invite Team Member">
        <div className="flex gap-3 items-end">
          <Field label="Email Address" className="flex-1">
            <input className={iCls} value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInvite()} placeholder="colleague@company.com" type="email" />
          </Field>
          <Field label="Role">
            <select className={cn(iCls, "w-36")} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="security">Security</option>
              <option value="viewer">Viewer</option>
            </select>
          </Field>
          <button onClick={handleInvite} className="btn-primary flex-shrink-0 mb-0.5">Send Invite</button>
        </div>
        <p className="text-[11.5px] text-muted-foreground mt-2.5">
          The invitee will receive an email with a link to create their account and join {user?.company?.name ?? "your workspace"}.
        </p>
      </Card>

      <Card title="Team Roles" bodyPad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase text-[10.5px] tracking-wide">Role</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase text-[10.5px] tracking-wide">Capabilities</th>
              </tr>
            </thead>
            <tbody>
              {[
                { role: "Super Admin", desc: "Full platform access, company CRM, billing, impersonation", color: "bg-amber-50 text-amber-700" },
                { role: "Admin", desc: "Manage users, offices, settings, customization for the company", color: "bg-orange-50 text-orange-700" },
                { role: "Security", desc: "Check in/out visitors, manage gate passes, view logs", color: "bg-blue-50 text-blue-700" },
                { role: "Viewer", desc: "Read-only access to visitors and logs", color: "bg-slate-100 text-slate-600" },
              ].map(r => (
                <tr key={r.role} className="border-b border-border last:border-0">
                  <td className="px-4 py-3"><span className={cn("text-[10.5px] font-bold px-2 py-1 rounded-full", r.color)}>{r.role}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[12px] text-amber-700 flex items-start gap-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Invited users are assigned the Viewer role by default. Admins can change roles after the user joins from the Admin panel.
      </div>
    </div>
  );
}

// ─── Locations Tab ────────────────────────────────────────────────────────────

type OfficeRow = { id: string; name: string; city: string; address?: string | null; isActive: boolean };

function LocationsTab() {
  const qc = useQueryClient();
  const { data: offices = [] } = useListOffices() as { data: OfficeRow[] };
  const createOfficeMut = useCreateOffice();
  const updateOfficeMut = useUpdateOffice();
  const deleteOfficeMut = useDeleteOffice();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newAddr, setNewAddr] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddr, setEditAddr] = useState("");

  const refetch = () => qc.invalidateQueries({ queryKey: ["listOffices"] });

  const handleAdd = () => {
    if (!newName.trim() || !newCity.trim()) { toast.error("Name and city are required"); return; }
    createOfficeMut.mutate(
      { data: { name: newName.trim(), city: newCity.trim(), address: newAddr.trim() || undefined } },
      {
        onSuccess: () => { toast.success("Location added"); setAdding(false); setNewName(""); setNewCity(""); setNewAddr(""); refetch(); },
        onError: () => toast.error("Failed to add location"),
      }
    );
  };

  const startEdit = (o: OfficeRow) => {
    setEditId(o.id); setEditName(o.name); setEditCity(o.city); setEditAddr(o.address ?? "");
  };

  const saveEdit = () => {
    if (!editId) return;
    if (!editName.trim() || !editCity.trim()) { toast.error("Name and city are required"); return; }
    updateOfficeMut.mutate(
      { officeId: editId, data: { name: editName.trim(), city: editCity.trim(), address: editAddr.trim() || undefined } },
      {
        onSuccess: () => { toast.success("Location updated"); setEditId(null); refetch(); },
        onError: () => toast.error("Failed to update location"),
      }
    );
  };

  const toggleActive = (o: OfficeRow) => {
    updateOfficeMut.mutate(
      { officeId: o.id, data: { isActive: !o.isActive } },
      {
        onSuccess: () => { toast.success(o.isActive ? "Location deactivated" : "Location activated"); refetch(); },
        onError: () => toast.error("Failed to update"),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteOfficeMut.mutate(
      { officeId: id },
      {
        onSuccess: () => { toast.success("Location removed"); refetch(); },
        onError: () => toast.error("Failed to remove"),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-foreground">Office Locations</p>
          <p className="text-[12px] text-muted-foreground">Add and manage the offices / branches for your organisation</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Location
        </button>
      </div>

      {adding && (
        <Card title="New Location">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Office Name *">
                <input className={iCls} value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Mumbai HQ" />
              </Field>
              <Field label="City *">
                <input className={iCls} value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="e.g. Mumbai" />
              </Field>
            </div>
            <Field label="Address (optional)">
              <input className={iCls} value={newAddr} onChange={e => setNewAddr(e.target.value)} placeholder="e.g. 4th Floor, Bandra Kurla Complex" />
            </Field>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleAdd} disabled={createOfficeMut.isPending} className="btn-primary">
                {createOfficeMut.isPending ? "Saving…" : "Save Location"}
              </button>
            </div>
          </div>
        </Card>
      )}

      {offices.length === 0 && !adding && (
        <div className="border border-dashed border-border rounded-xl py-12 text-center text-muted-foreground text-[13px]">
          No locations yet. Add your first office above.
        </div>
      )}

      <div className="space-y-2">
        {offices.map(o => (
          <div key={o.id} className={cn("bg-card border border-border rounded-xl overflow-hidden", !o.isActive && "opacity-60")}>
            {editId === o.id ? (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Office Name *">
                    <input className={iCls} value={editName} onChange={e => setEditName(e.target.value)} />
                  </Field>
                  <Field label="City *">
                    <input className={iCls} value={editCity} onChange={e => setEditCity(e.target.value)} />
                  </Field>
                </div>
                <Field label="Address">
                  <input className={iCls} value={editAddr} onChange={e => setEditAddr(e.target.value)} placeholder="Optional" />
                </Field>
                <div className="flex gap-2 justify-end pt-1">
                  <button onClick={() => setEditId(null)} className="btn-ghost">Cancel</button>
                  <button onClick={saveEdit} disabled={updateOfficeMut.isPending} className="btn-primary">
                    {updateOfficeMut.isPending ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#c06b2c" strokeWidth="1.8" className="w-4.5 h-4.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-foreground">{o.name}</span>
                    {!o.isActive && (
                      <span className="text-[10px] font-bold bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">
                    {o.city}{o.address ? ` · ${o.address}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(o)}
                    className={cn("w-9 h-5 rounded-full relative transition-colors", o.isActive ? "bg-primary" : "bg-border")}
                  >
                    <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all", o.isActive ? "left-[18px]" : "left-0.5")} />
                  </button>
                  <button
                    onClick={() => startEdit(o)}
                    className="text-[12px] text-muted-foreground border border-border rounded-lg px-2.5 py-1 hover:bg-secondary transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(o.id)}
                    className="text-[12px] text-destructive border border-destructive/30 rounded-lg px-2.5 py-1 hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-[12px] text-blue-700 flex items-start gap-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Each location appears in the office picker. Users are assigned to a location during onboarding. Inactive locations won't appear for new visitors.
      </div>
    </div>
  );
}

// ─── Users in Team Tab (real API) ─────────────────────────────────────────────

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab({ notifications, onToggle }: { notifications: Record<string, boolean>; onToggle: (id: string) => void }) {
  const [emailAddr, setEmailAddr] = useState("");
  return (
    <div className="space-y-4">
      <Card title="In-App Notifications" bodyPad={false}>
        <div className="divide-y divide-border">
          {NOTIFICATION_TOGGLES.map(n => (
            <div key={n.id} className="flex items-center gap-4 px-4 py-3.5">
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-foreground">{n.label}</div>
                <div className="text-[11.5px] text-muted-foreground mt-0.5">{n.desc}</div>
              </div>
              <button onClick={() => onToggle(n.id)}
                className={cn("w-9 h-5 rounded-full relative transition-colors flex-shrink-0", notifications[n.id] ? "bg-primary" : "bg-border")}>
                <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all", notifications[n.id] ? "left-[18px]" : "left-0.5")} />
              </button>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Email Digest">
        <p className="text-[12.5px] text-muted-foreground mb-3">Receive a daily summary email to the address below. Leave blank to use your account email.</p>
        <div className="flex gap-2">
          <input className={cn(iCls, "flex-1")} value={emailAddr} onChange={e => setEmailAddr(e.target.value)} placeholder="notify@yourcompany.com" type="email" />
          <button className="btn-primary flex-shrink-0" onClick={() => toast.success("Email digest settings saved")}>Save</button>
        </div>
      </Card>
    </div>
  );
}

// ─── Integrations Tab ─────────────────────────────────────────────────────────

type WebhookEntry = { id: string; url: string; secret: string; events: string[]; enabled: boolean; createdAt: string };
type ApiKeyEntry = { id: string; label: string; key: string; createdAt: string; lastUsed: string | null };

function loadWebhooks(): WebhookEntry[] {
  try { const s = localStorage.getItem("gp_webhooks_v1"); return s ? JSON.parse(s) : []; } catch { return []; }
}
function loadApiKeys(): ApiKeyEntry[] {
  try { const s = localStorage.getItem("gp_apikeys_v1"); return s ? JSON.parse(s) : []; } catch { return []; }
}
function saveWebhooks(wh: WebhookEntry[]) { localStorage.setItem("gp_webhooks_v1", JSON.stringify(wh)); }
function saveApiKeys(keys: ApiKeyEntry[]) { localStorage.setItem("gp_apikeys_v1", JSON.stringify(keys)); }

function generateApiKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "gp_live_";
  for (let i = 0; i < 40; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

function IntegrationsTab() {
  const [sub, setSub] = useState<IntegSub>("sso");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-secondary border border-border rounded-xl p-1 w-fit">
        {([
          { id: "sso" as IntegSub, label: "SSO & Auth" },
          { id: "messaging" as IntegSub, label: "Messaging" },
          { id: "webhooks" as IntegSub, label: "Webhooks" },
          { id: "api-keys" as IntegSub, label: "API Keys" },
        ]).map(s => (
          <button key={s.id} onClick={() => setSub(s.id)}
            className={cn("px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium transition-all",
              sub === s.id ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground")}>
            {s.label}
          </button>
        ))}
      </div>
      {sub === "sso" && <SSOSection />}
      {sub === "messaging" && <MessagingSection />}
      {sub === "webhooks" && <WebhooksSection />}
      {sub === "api-keys" && <ApiKeysSection />}
    </div>
  );
}

function SSOSection() {
  const [provider, setProvider] = useState<"saml" | "oidc" | "none">("none");
  const [saml, setSaml] = useState({ entityId: "", ssoUrl: "", certificate: "", emailAttr: "email", firstNameAttr: "firstName", lastNameAttr: "lastName" });
  const [oidc, setOidc] = useState({ discoveryUrl: "", clientId: "", clientSecret: "" });
  const [saving, setSaving] = useState(false);

  const basePath = window.location.origin + (import.meta.env.BASE_URL?.replace(/\/$/, "") || "");
  const spEntityId = `${basePath}/api/sso/saml/metadata`;
  const acsUrl = `${basePath}/api/sso/saml/callback`;

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast.success("SSO configuration saved");
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-[12.5px] text-blue-700 flex items-start gap-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>Configure single sign-on so your team can log in with your company's identity provider (Okta, Azure AD, Google Workspace, etc.).</span>
      </div>

      <Card title="Identity Provider">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { id: "none", label: "Email / Password", icon: "🔑", desc: "Default Clerk auth" },
            { id: "saml", label: "SAML 2.0", icon: "🏢", desc: "Okta, Azure AD, Ping" },
            { id: "oidc", label: "OIDC / OAuth2", icon: "⚡", desc: "Google, Okta, custom" },
          ].map(p => (
            <button key={p.id} onClick={() => setProvider(p.id as typeof provider)}
              className={cn("border-[1.5px] rounded-xl p-3 text-left transition-all",
                provider === p.id ? "border-primary bg-orange-50" : "border-border hover:border-primary/30")}>
              <div className="text-lg mb-1">{p.icon}</div>
              <div className="text-[12.5px] font-semibold text-foreground">{p.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>

        {provider === "saml" && (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-[12.5px] font-semibold text-foreground mb-2">Service Provider Details (give these to your IdP):</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="SP Entity ID / Audience URI">
                <div className="flex gap-1.5">
                  <input className={cn(iCls, "flex-1 font-mono text-[11px]")} value={spEntityId} readOnly style={{ opacity: 0.7 }} />
                  <button onClick={() => { navigator.clipboard.writeText(spEntityId); toast.success("Copied"); }} className="btn-ghost flex-shrink-0">Copy</button>
                </div>
              </Field>
              <Field label="ACS URL (Reply URL)">
                <div className="flex gap-1.5">
                  <input className={cn(iCls, "flex-1 font-mono text-[11px]")} value={acsUrl} readOnly style={{ opacity: 0.7 }} />
                  <button onClick={() => { navigator.clipboard.writeText(acsUrl); toast.success("Copied"); }} className="btn-ghost flex-shrink-0">Copy</button>
                </div>
              </Field>
            </div>
            <p className="text-[12.5px] font-semibold text-foreground mt-3 mb-2">Identity Provider Settings (from your IdP):</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="IdP Entity ID / Issuer">
                <input className={iCls} value={saml.entityId} onChange={e => setSaml(s => ({ ...s, entityId: e.target.value }))} placeholder="https://your-idp.com/issuer" />
              </Field>
              <Field label="Single Sign-On URL">
                <input className={iCls} value={saml.ssoUrl} onChange={e => setSaml(s => ({ ...s, ssoUrl: e.target.value }))} placeholder="https://your-idp.com/sso" />
              </Field>
            </div>
            <Field label="X.509 Certificate (PEM format)">
              <textarea className={cn(iCls, "font-mono text-[11px] h-24 resize-none")} value={saml.certificate}
                onChange={e => setSaml(s => ({ ...s, certificate: e.target.value }))} placeholder="-----BEGIN CERTIFICATE-----&#10;MIIBkTCB+wIJ...&#10;-----END CERTIFICATE-----" />
            </Field>
            <p className="text-[12px] font-semibold text-foreground mt-1 mb-2">Attribute Mapping:</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Email Attribute">
                <input className={iCls} value={saml.emailAttr} onChange={e => setSaml(s => ({ ...s, emailAttr: e.target.value }))} placeholder="email" />
              </Field>
              <Field label="First Name Attribute">
                <input className={iCls} value={saml.firstNameAttr} onChange={e => setSaml(s => ({ ...s, firstNameAttr: e.target.value }))} placeholder="firstName" />
              </Field>
              <Field label="Last Name Attribute">
                <input className={iCls} value={saml.lastNameAttr} onChange={e => setSaml(s => ({ ...s, lastNameAttr: e.target.value }))} placeholder="lastName" />
              </Field>
            </div>
          </div>
        )}

        {provider === "oidc" && (
          <div className="space-y-3 border-t border-border pt-4">
            <Field label="OIDC Discovery URL / Well-Known Endpoint">
              <input className={iCls} value={oidc.discoveryUrl} onChange={e => setOidc(o => ({ ...o, discoveryUrl: e.target.value }))} placeholder="https://your-idp.com/.well-known/openid-configuration" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Client ID">
                <input className={iCls} value={oidc.clientId} onChange={e => setOidc(o => ({ ...o, clientId: e.target.value }))} placeholder="your-client-id" />
              </Field>
              <Field label="Client Secret">
                <input className={iCls} type="password" value={oidc.clientSecret} onChange={e => setOidc(o => ({ ...o, clientSecret: e.target.value }))} placeholder="••••••••••••" />
              </Field>
            </div>
          </div>
        )}

        {provider !== "none" && (
          <div className="flex justify-end mt-4 pt-3 border-t border-border">
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save SSO Configuration"}</button>
          </div>
        )}
      </Card>
    </div>
  );
}

function MessagingSection() {
  const [channel, setChannel] = useState<MsgChannel>("email");
  const [email, setEmail] = useState({ provider: "resend", apiKey: "", fromEmail: "", fromName: "" });
  const [wa, setWa] = useState({ accountSid: "", authToken: "", number: "" });
  const [sms, setSms] = useState({ accountSid: "", authToken: "", number: "" });
  const [testEmail, setTestEmail] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    toast.success("Messaging settings saved");
  };

  const handleTest = async () => {
    setTesting(true);
    await new Promise(r => setTimeout(r, 1200));
    setTesting(false);
    if (channel === "email") toast.success(`Test email sent to ${testEmail || "your account email"}`);
    else toast.success(`Test message sent to ${testPhone || "configured number"}`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[12.5px] text-amber-700 flex items-start gap-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0 mt-0.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span>Configure messaging channels to send visitor registration links, check-in notifications, and alerts via Email, WhatsApp, or SMS.</span>
      </div>

      <div className="flex gap-1 bg-secondary border border-border rounded-xl p-1 w-fit">
        {([
          { id: "email" as MsgChannel, label: "Email" },
          { id: "whatsapp" as MsgChannel, label: "WhatsApp" },
          { id: "sms" as MsgChannel, label: "SMS" },
        ]).map(c => (
          <button key={c.id} onClick={() => setChannel(c.id)}
            className={cn("px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all",
              channel === c.id ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground")}>
            {c.label}
          </button>
        ))}
      </div>

      {channel === "email" && (
        <Card title="Email Configuration">
          <div className="space-y-3">
            <Field label="Email Provider">
              <select className={iCls} value={email.provider} onChange={e => setEmail(em => ({ ...em, provider: e.target.value }))}>
                <option value="resend">Resend</option>
                <option value="sendgrid">SendGrid</option>
                <option value="ses">Amazon SES</option>
                <option value="smtp">Custom SMTP</option>
              </select>
            </Field>
            <Field label="API Key">
              <input className={iCls} type="password" value={email.apiKey} onChange={e => setEmail(em => ({ ...em, apiKey: e.target.value }))} placeholder="re_••••••••••••••••••••••••" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From Email">
                <input className={iCls} type="email" value={email.fromEmail} onChange={e => setEmail(em => ({ ...em, fromEmail: e.target.value }))} placeholder="noreply@yourcompany.com" />
              </Field>
              <Field label="From Name">
                <input className={iCls} value={email.fromName} onChange={e => setEmail(em => ({ ...em, fromName: e.target.value }))} placeholder="GatePass — Your Company" />
              </Field>
            </div>
            <div className="pt-2 border-t border-border flex items-end gap-2">
              <Field label="Test Email Address" className="flex-1">
                <input className={iCls} type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com" />
              </Field>
              <button onClick={handleTest} disabled={testing} className="btn-ghost flex-shrink-0 mb-0.5">{testing ? "Sending…" : "Send Test"}</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-shrink-0 mb-0.5">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </Card>
      )}

      {(channel === "whatsapp" || channel === "sms") && (
        <Card title={channel === "whatsapp" ? "WhatsApp (via Twilio)" : "SMS (via Twilio)"}>
          <div className="space-y-3">
            <div className="bg-secondary border border-border rounded-lg px-3 py-2.5 text-[12px] text-muted-foreground">
              You'll need a <a href="https://www.twilio.com" target="_blank" rel="noreferrer" className="text-primary underline">Twilio account</a> with a{channel === "whatsapp" ? " WhatsApp Business" : "n SMS-enabled"} number.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Account SID">
                <input className={iCls} value={channel === "whatsapp" ? wa.accountSid : sms.accountSid}
                  onChange={e => channel === "whatsapp" ? setWa(w => ({ ...w, accountSid: e.target.value })) : setSms(s => ({ ...s, accountSid: e.target.value }))}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
              </Field>
              <Field label="Auth Token">
                <input className={iCls} type="password" value={channel === "whatsapp" ? wa.authToken : sms.authToken}
                  onChange={e => channel === "whatsapp" ? setWa(w => ({ ...w, authToken: e.target.value })) : setSms(s => ({ ...s, authToken: e.target.value }))}
                  placeholder="••••••••••••••••••••••••••••••••" />
              </Field>
            </div>
            <Field label={channel === "whatsapp" ? "WhatsApp Number" : "SMS Number"}>
              <input className={iCls} value={channel === "whatsapp" ? wa.number : sms.number}
                onChange={e => channel === "whatsapp" ? setWa(w => ({ ...w, number: e.target.value })) : setSms(s => ({ ...s, number: e.target.value }))}
                placeholder="+14155551234" />
            </Field>
            <div className="pt-2 border-t border-border flex items-end gap-2">
              <Field label="Test Phone Number" className="flex-1">
                <input className={iCls} value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="+919876543210" />
              </Field>
              <button onClick={handleTest} disabled={testing} className="btn-ghost flex-shrink-0 mb-0.5">{testing ? "Sending…" : "Send Test"}</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-shrink-0 mb-0.5">{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function WebhooksSection() {
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>(loadWebhooks);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState<string[]>(["visitor.checkin", "visitor.checkout", "gatepass.created"]);
  const [adding, setAdding] = useState(false);

  const addWebhook = () => {
    if (!url.trim()) { toast.error("Webhook URL is required"); return; }
    if (!url.startsWith("https://")) { toast.error("Webhook URL must use HTTPS"); return; }
    if (!events.length) { toast.error("Select at least one event"); return; }
    const next: WebhookEntry[] = [...webhooks, { id: Date.now().toString(), url: url.trim(), secret: secret.trim() || generateApiKey().slice(0, 32), events, enabled: true, createdAt: new Date().toISOString() }];
    setWebhooks(next); saveWebhooks(next);
    setUrl(""); setSecret(""); setAdding(false);
    toast.success("Webhook added");
  };

  const toggleWebhook = (id: string) => {
    const next = webhooks.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w);
    setWebhooks(next); saveWebhooks(next);
  };

  const removeWebhook = (id: string) => {
    const next = webhooks.filter(w => w.id !== id);
    setWebhooks(next); saveWebhooks(next);
    toast.success("Webhook removed");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-foreground">Webhook Endpoints</p>
          <p className="text-[12px] text-muted-foreground">Send real-time event data to your systems</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Webhook
        </button>
      </div>

      {adding && (
        <Card title="New Webhook">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Endpoint URL">
                <input className={iCls} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-app.com/webhooks/gatepass" />
              </Field>
              <Field label="Signing Secret (optional)">
                <input className={iCls} value={secret} onChange={e => setSecret(e.target.value)} placeholder="Auto-generated if blank" />
              </Field>
            </div>
            <Field label="Events to Subscribe">
              <div className="grid grid-cols-2 gap-2 mt-1">
                {WEBHOOK_EVENTS.map(ev => (
                  <label key={ev.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={events.includes(ev.id)}
                      onChange={e => setEvents(prev => e.target.checked ? [...prev, ev.id] : prev.filter(x => x !== ev.id))}
                      className="rounded border-border text-primary" />
                    <span className="text-[12.5px] text-foreground">{ev.label}</span>
                  </label>
                ))}
              </div>
            </Field>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setAdding(false)} className="btn-ghost">Cancel</button>
              <button onClick={addWebhook} className="btn-primary">Save Webhook</button>
            </div>
          </div>
        </Card>
      )}

      {webhooks.length === 0 && !adding && (
        <div className="border border-dashed border-border rounded-xl py-10 text-center text-muted-foreground text-[13px]">
          No webhooks configured yet. Add one above to receive real-time events.
        </div>
      )}

      {webhooks.map(wh => (
        <div key={wh.id} className={cn("border border-border rounded-xl px-4 py-3.5 bg-card transition-opacity", !wh.enabled && "opacity-60")}>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", wh.enabled ? "bg-green-500" : "bg-muted-foreground")} />
                <span className="text-[13px] font-mono font-medium text-foreground truncate">{wh.url}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {wh.events.map(ev => <span key={ev} className="text-[10.5px] font-medium bg-secondary border border-border px-1.5 py-0.5 rounded-full text-muted-foreground">{ev}</span>)}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggleWebhook(wh.id)}
                className={cn("w-9 h-5 rounded-full relative transition-colors", wh.enabled ? "bg-primary" : "bg-border")}>
                <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all", wh.enabled ? "left-[18px]" : "left-0.5")} />
              </button>
              <button onClick={() => removeWebhook(wh.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="bg-secondary border border-border rounded-xl px-4 py-3 text-[12px] text-muted-foreground">
        All webhook payloads include an <code className="font-mono bg-border/50 px-1 rounded">X-GatePass-Signature</code> header (HMAC-SHA256) for verification.
      </div>
    </div>
  );
}

function ApiKeysSection() {
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>(loadApiKeys);
  const [label, setLabel] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealing, setRevealing] = useState<string | null>(null);

  const createKey = () => {
    if (!label.trim()) { toast.error("Enter a label for this key"); return; }
    const newKey: ApiKeyEntry = { id: Date.now().toString(), label: label.trim(), key: generateApiKey(), createdAt: new Date().toISOString(), lastUsed: null };
    const next = [...apiKeys, newKey];
    setApiKeys(next); saveApiKeys(next);
    setLabel(""); setRevealing(newKey.id);
    toast.success("API key created — copy it now, it won't be shown again");
  };

  const revokeKey = (id: string) => {
    const next = apiKeys.filter(k => k.id !== id);
    setApiKeys(next); saveApiKeys(next);
    toast.success("API key revoked");
  };

  const copyKey = (key: ApiKeyEntry) => {
    navigator.clipboard.writeText(key.key);
    setCopiedId(key.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("API key copied to clipboard");
  };

  return (
    <div className="space-y-4">
      <Card title="Generate API Key">
        <div className="flex gap-2">
          <Field label="Key Label / Description" className="flex-1">
            <input className={iCls} value={label} onChange={e => setLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createKey()} placeholder="e.g. Production Integration, Zapier, etc." />
          </Field>
          <button onClick={createKey} className="btn-primary flex-shrink-0 self-end mb-0.5">Generate Key</button>
        </div>
        <p className="text-[11.5px] text-muted-foreground mt-2">
          API keys provide programmatic access to your GatePass data. Pass as <code className="font-mono bg-border/50 px-1 rounded">Authorization: Bearer &lt;key&gt;</code>.
        </p>
      </Card>

      {apiKeys.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-10 text-center text-muted-foreground text-[13px]">
          No API keys yet. Generate one above to get started.
        </div>
      ) : (
        <Card title="Active Keys" bodyPad={false}>
          <div className="divide-y divide-border">
            {apiKeys.map(k => (
              <div key={k.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-muted-foreground"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-foreground">{k.label}</div>
                  <div className="font-mono text-[11px] text-muted-foreground truncate">
                    {revealing === k.id ? k.key : `${k.key.slice(0, 16)}${"•".repeat(24)}`}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground/60 mt-0.5">
                    Created {new Date(k.createdAt).toLocaleDateString()} · {k.lastUsed ? `Last used ${new Date(k.lastUsed).toLocaleDateString()}` : "Never used"}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setRevealing(revealing === k.id ? null : k.id)}
                    className="text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-1 transition-colors">
                    {revealing === k.id ? "Hide" : "Reveal"}
                  </button>
                  <button onClick={() => copyKey(k)}
                    className="text-[11px] text-primary border border-primary/30 rounded-lg px-2 py-1 hover:bg-orange-50 transition-colors">
                    {copiedId === k.id ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={() => revokeKey(k.id)}
                    className="text-[11px] text-destructive border border-destructive/30 rounded-lg px-2 py-1 hover:bg-red-50 transition-colors">
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Appearance Tab ───────────────────────────────────────────────────────────

function AppearanceTab() {
  const branding = useBranding();
  const [hexInput, setHexInput] = useState(branding.primaryColor);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleColorSwatch = (c: string) => {
    setHexInput(c);
    branding.update({ primaryColor: c });
    toast.success("Brand color updated");
  };

  const handleHexInput = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      branding.update({ primaryColor: val });
      toast.success("Brand color updated");
    }
  };

  const handleNativePicker = (val: string) => {
    setHexInput(val);
    branding.update({ primaryColor: val });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target?.result as string;
      branding.update({ logoUrl: url });
      toast.success("Logo uploaded");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <Card title="Company Branding">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Field label="Company Name (shown in sidebar & badges)">
              <input className={iCls} value={branding.companyName} onChange={e => branding.update({ companyName: e.target.value })} placeholder="Your Company" />
            </Field>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Company Logo</label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl border-[1.5px] border-border bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-muted-foreground/40">
                    <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                )}
              </div>
              <div className="space-y-1.5">
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleLogoUpload} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="btn-ghost text-[12px]">
                  {branding.logoUrl ? "Change Logo" : "Upload Logo"}
                </button>
                {branding.logoUrl && (
                  <button onClick={() => { branding.update({ logoUrl: null }); toast.success("Logo removed"); }}
                    className="block text-[11.5px] text-destructive hover:underline">Remove</button>
                )}
                <p className="text-[10.5px] text-muted-foreground">PNG, SVG, JPG · max 2 MB</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[11.5px] text-muted-foreground mt-3 pt-3 border-t border-border">
          Your logo will appear in the sidebar, visitor badges, gate pass prints, and email notifications.
        </p>
      </Card>

      <Card title="Brand Color">
        <p className="text-[12.5px] text-muted-foreground mb-3">Primary color applied to buttons, badges, active nav items, and chart accents.</p>
        <div className="flex items-center gap-3 flex-wrap mb-3">
          {COLOR_SWATCHES.map(c => (
            <button key={c} onClick={() => handleColorSwatch(c)}
              className={cn("w-7 h-7 rounded-lg border-2 transition-all", branding.primaryColor === c ? "border-foreground scale-110 shadow-md" : "border-transparent hover:scale-105 hover:shadow-sm")}
              style={{ backgroundColor: c }} title={c} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-secondary border border-border rounded-lg px-2.5 py-1.5 w-32">
            <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: branding.primaryColor }} />
            <span className="text-[11px] text-muted-foreground">#</span>
            <input
              className="flex-1 bg-transparent text-[12.5px] font-mono text-foreground outline-none uppercase w-20"
              value={hexInput.replace("#", "")}
              onChange={e => handleHexInput("#" + e.target.value)}
              maxLength={6}
              placeholder="C06B2C"
            />
          </div>
          <div className="relative">
            <input type="color" value={branding.primaryColor} onChange={e => handleNativePicker(e.target.value)}
              className="w-9 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent" />
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <div className="w-6 h-6 rounded-lg shadow-sm" style={{ backgroundColor: branding.primaryColor }} />
            <span className="font-mono">{branding.primaryColor.toUpperCase()}</span>
          </div>
        </div>
      </Card>

      <Card title="Font Family">
        <p className="text-[12.5px] text-muted-foreground mb-3">Applied across all screens, visitor badges, and printouts.</p>
        <div className="grid grid-cols-2 gap-2">
          {FONTS.map(f => (
            <button key={f} onClick={() => { branding.update({ font: f }); toast.success(`Font set to ${f}`); }}
              className={cn("border-[1.5px] rounded-xl px-4 py-3 text-left transition-all",
                branding.font === f ? "border-primary bg-orange-50" : "border-border hover:border-primary/30")}>
              <div className="text-[13.5px] font-semibold text-foreground" style={{ fontFamily: `'${f}', sans-serif` }}>{f}</div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5" style={{ fontFamily: `'${f}', sans-serif` }}>
                The quick brown fox jumps · 0123456789
              </div>
              {branding.font === f && <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block">Active</span>}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Theme">
        <p className="text-[12.5px] text-muted-foreground mb-3">Interface color scheme.</p>
        <div className="flex gap-3">
          {[{ id: "light", label: "Light", icon: "☀️" }, { id: "dark", label: "Dark", icon: "🌙" }, { id: "system", label: "System", icon: "💻" }].map(t => (
            <button key={t.id} onClick={() => t.id !== "light" && toast.info("Dark mode coming soon")}
              className={cn("flex-1 py-3 border rounded-xl text-[12.5px] font-medium transition-all",
                t.id === "light" ? "border-primary bg-orange-50 text-primary" : "border-border text-muted-foreground hover:border-border/80")}>
              <div className="text-lg mb-1">{t.icon}</div>
              {t.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function Toggle({ checked, onChange, color = "primary", disabled = false }: {
  checked: boolean; onChange: () => void; color?: "primary" | "teal" | "amber"; disabled?: boolean;
}) {
  const bgMap = { primary: "bg-primary", teal: "bg-teal-600", amber: "bg-amber-500" };
  return (
    <button onClick={onChange} disabled={disabled}
      className={cn("w-9 h-5 rounded-full relative transition-colors", checked ? bgMap[color] : "bg-border", disabled && "opacity-40 cursor-not-allowed")}>
      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all", checked ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

function PwField({ label, value, onChange, show, onToggle, error, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; error?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className={cn(iCls, "pr-10", error && "border-red-400 focus:border-red-400 focus:ring-red-100")} />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          {show ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special char", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const label = score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";
  const color = score <= 1 ? "bg-red-500" : score === 2 ? "bg-amber-500" : score === 3 ? "bg-blue-500" : "bg-green-500";
  const textColor = score <= 1 ? "text-red-600" : score === 2 ? "text-amber-600" : score === 3 ? "text-blue-600" : "text-green-600";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4].map(i => <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= score ? color : "bg-border")} />)}
        </div>
        <span className={cn("text-[11px] font-semibold", textColor)}>{label}</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {checks.map(c => (
          <span key={c.label} className={cn("text-[11px] flex items-center gap-1", c.pass ? "text-green-600" : "text-muted-foreground/60")}>
            {c.pass ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><circle cx="12" cy="12" r="10"/></svg>}
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function BadgePreview({ id, active }: { id: string; active: boolean }) {
  const color = active ? "#c06b2c" : "#9aaa9a";
  if (id === "classic") return <div className="flex flex-col items-center gap-1 py-2"><div className="w-8 h-1.5 rounded-sm" style={{ backgroundColor: color }} /><div className="w-8 h-8 rounded-full border-2" style={{ borderColor: color + "44", background: "#f4f6f4" }} /><div className="w-12 h-1 rounded" style={{ backgroundColor: color + "aa" }} /><div className="w-8 h-0.5 rounded" style={{ backgroundColor: "#e0d8d0" }} /></div>;
  if (id === "minimal") return <div className="flex flex-col gap-1 py-2 px-3"><div className="w-10 h-1.5 rounded" style={{ backgroundColor: color + "aa" }} /><div className="w-7 h-1 rounded" style={{ backgroundColor: "#e0d8d0" }} /><div className="w-12 h-2 rounded mt-1" style={{ backgroundColor: color + "22" }} /><div className="w-8 h-0.5 rounded" style={{ backgroundColor: "#e0d8d0" }} /></div>;
  return <div className="flex flex-col items-center gap-1 py-2"><div className="w-8 h-4 rounded" style={{ backgroundColor: color + "22" }} /><div className="text-[22px] font-black" style={{ color }}>ID</div><div className="w-12 h-1 rounded" style={{ backgroundColor: color + "55" }} /></div>;
}

function GPPreview({ id, active }: { id: string; active: boolean }) {
  const color = active ? "#0d9488" : "#9aaa9a";
  if (id === "detailed") return <div className="grid grid-cols-2 gap-1 p-3 w-full max-w-[80px]">{[1,2,3,4].map(i => <div key={i} className="h-3 rounded" style={{ backgroundColor: color + "33" }} />)}</div>;
  if (id === "compact") return <div className="flex flex-col gap-1.5 p-3">{[1,2,3].map(i => <div key={i} className="h-1.5 rounded" style={{ backgroundColor: color + "55", width: `${60 + i * 10}%` }} />)}</div>;
  return <div className="flex flex-col gap-1.5 p-3"><div className="h-1.5 rounded" style={{ backgroundColor: color + "55", width: "80%" }} /><div className="h-1.5 rounded" style={{ backgroundColor: color + "33", width: "60%" }} /><div className="h-2.5 rounded mt-1" style={{ backgroundColor: color + "22" }} /></div>;
}

function Card({ title, children, bodyPad = true }: { title: string; children: React.ReactNode; bodyPad?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border"><h3 className="font-bold text-[13px] text-foreground">{title}</h3></div>
      <div className={bodyPad ? "p-5" : ""}>{children}</div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function formatRole(role: string) {
  return { super_admin: "Super Admin", admin: "Admin", security: "Security Officer", viewer: "Viewer" }[role] ?? role;
}

const iCls = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[13.5px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
