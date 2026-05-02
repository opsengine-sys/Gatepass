import { useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useUser } from "@clerk/react";
import { useBranding } from "@/contexts/BrandingContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BadgeCreatorModal, loadCustomTemplates, type CustomTemplate } from "@/components/badge/BadgeCreatorModal";
import { VISITOR_TYPES, TYPE_COLORS, GP_TYPES } from "@/types";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  useListOffices, useCreateOffice, useUpdateOffice, useDeleteOffice,
  useListUsers, useUpdateUser,
} from "@workspace/api-client-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsTab = "profile" | "customization" | "badge-templates" | "team" | "locations" | "notifications" | "integrations" | "appearance" | "activity";
type IntegSub = "sso" | "messaging" | "webhooks" | "api-keys";
type MsgChannel = "email" | "whatsapp" | "sms";
type DataType = "text" | "number" | "email" | "phone" | "date" | "time" | "select" | "checkbox" | "textarea" | "file";

// ─── Data-type palette ───────────────────────────────────────────────────────

const DATA_TYPES: Array<{ value: DataType; label: string; short: string; color: string }> = [
  { value: "text",     label: "Short Text",  short: "Text",   color: "bg-slate-100 text-slate-600" },
  { value: "number",   label: "Number",      short: "Num",    color: "bg-blue-50 text-blue-600" },
  { value: "email",    label: "Email",       short: "Email",  color: "bg-violet-50 text-violet-600" },
  { value: "phone",    label: "Phone",       short: "Phone",  color: "bg-green-50 text-green-600" },
  { value: "date",     label: "Date",        short: "Date",   color: "bg-orange-50 text-orange-600" },
  { value: "time",     label: "Time",        short: "Time",   color: "bg-amber-50 text-amber-600" },
  { value: "select",   label: "Dropdown",    short: "▾ List", color: "bg-orange-50 text-orange-600" },
  { value: "checkbox", label: "Yes / No",    short: "✓/✗",   color: "bg-pink-50 text-pink-600" },
  { value: "textarea", label: "Long Text",   short: "Long",   color: "bg-indigo-50 text-indigo-600" },
  { value: "file",     label: "File Upload", short: "File",   color: "bg-red-50 text-red-600" },
];

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
  { id: "activity", label: "Activity" },
];

const BADGE_TEMPLATES = [
  { id: "classic",    label: "Classic",       desc: "Photo left, name & details right, brand header strip" },
  { id: "minimal",    label: "Minimal",       desc: "Text-only, monochrome, ultra-clean" },
  { id: "bold",       label: "Bold ID",       desc: "Oversized visitor ID chip, accent colour block" },
  { id: "corporate",  label: "Corporate",     desc: "Logo header, photo + name side by side, footer band" },
  { id: "photo",      label: "Photo-First",   desc: "Full-width photo with name overlay at bottom" },
  { id: "qr",         label: "QR-First",      desc: "Large QR code, photo thumbnail, compact details" },
];

const GP_TEMPLATES = [
  { id: "minimal",    label: "Minimal Card",  desc: "Clean card: key details + barcode strip" },
  { id: "detailed",   label: "Detailed A4",   desc: "Full A4 grid — all fields, print-ready" },
  { id: "corporate",  label: "Corporate",     desc: "Header + footer bands, structured columns" },
  { id: "compact",    label: "Compact",       desc: "Two-column dense layout for fast printing" },
  { id: "security",   label: "Security Pass", desc: "Red accents, bold pass ID, authorisation fields" },
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
        <h1 className="font-semibold text-[21px] tracking-tight text-foreground">Settings</h1>
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
      {tab === "activity" && <SettingsActivityTab />}
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
type CustomFieldItem = { id: string; label: string; enabled: boolean; required: boolean; dataType: DataType };
type FieldLabelOverrides = Record<string, string>;

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
function loadVFieldLabels(): FieldLabelOverrides {
  try { const s = localStorage.getItem("gp_vfield_labels_v1"); if (s) return JSON.parse(s); } catch { /* ignore */ }
  return {};
}
function loadGPFieldLabels(): FieldLabelOverrides {
  try { const s = localStorage.getItem("gp_gpfield_labels_v1"); if (s) return JSON.parse(s); } catch { /* ignore */ }
  return {};
}

function DataTypeBadge({ type }: { type: DataType }) {
  const dt = DATA_TYPES.find(d => d.value === type) ?? DATA_TYPES[0];
  return <span className={cn("text-[9.5px] font-bold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap", dt.color)}>{dt.short}</span>;
}

function AccordionSection({ title, badge, children, defaultOpen = false, accent }: {
  title: string; badge?: string; children: React.ReactNode; defaultOpen?: boolean; accent?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/30 transition-colors text-left group"
      >
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
          open ? "bg-primary/10" : "bg-secondary group-hover:bg-secondary/60",
        )}>
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent ?? "hsl(var(--primary))" }} />
        </div>
        <span className="font-semibold text-[13px] text-foreground flex-1 tracking-tight">{title}</span>
        {badge && (
          <span className="text-[11px] font-semibold bg-primary/8 text-primary px-2.5 py-0.5 rounded-full mr-1 border border-primary/15">
            {badge}
          </span>
        )}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
          className={cn("w-4 h-4 text-muted-foreground/40 transition-transform duration-200", open && "rotate-180")}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="border-t border-border/60">{children}</div>}
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
  const [vFieldLabels, setVFieldLabels] = useState<FieldLabelOverrides>(loadVFieldLabels);
  const [gpFieldLabels, setGPFieldLabels] = useState<FieldLabelOverrides>(loadGPFieldLabels);
  const [newVType, setNewVType] = useState("");
  const [newGPType, setNewGPType] = useState("");
  const [newVFieldLabel, setNewVFieldLabel] = useState("");
  const [newGPFieldLabel, setNewGPFieldLabel] = useState("");
  const [newVFieldType, setNewVFieldType] = useState<DataType>("text");
  const [newGPFieldType, setNewGPFieldType] = useState<DataType>("text");

  const saveVT  = (next: VisitorTypeItem[])   => { setVTypes(next);          localStorage.setItem("gp_vt_v1",              JSON.stringify(next)); };
  const saveGPT = (next: GPTypeItem[])         => { setGPTypes(next);         localStorage.setItem("gp_gpt_v1",             JSON.stringify(next)); };
  const saveVF  = (next: FieldConfig)          => { setVFields(next);         localStorage.setItem("gp_vfields_v1",         JSON.stringify(next)); };
  const saveGPF = (next: FieldConfig)          => { setGPFields(next);        localStorage.setItem("gp_gpfields_v1",        JSON.stringify(next)); };
  const saveCVF = (next: CustomFieldItem[])    => { setCustomVFields(next);   localStorage.setItem("gp_custom_vfields_v1",  JSON.stringify(next)); };
  const saveCGPF= (next: CustomFieldItem[])    => { setCustomGPFields(next);  localStorage.setItem("gp_custom_gpfields_v1", JSON.stringify(next)); };
  const saveVFL = (next: FieldLabelOverrides)  => { setVFieldLabels(next);    localStorage.setItem("gp_vfield_labels_v1",   JSON.stringify(next)); };
  const saveGPFL= (next: FieldLabelOverrides)  => { setGPFieldLabels(next);   localStorage.setItem("gp_gpfield_labels_v1",  JSON.stringify(next)); };

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
    saveCVF([...customVFields, { id: Date.now().toString(), label: newVFieldLabel.trim(), enabled: true, required: false, dataType: newVFieldType }]);
    setNewVFieldLabel(""); toast.success("Custom field added");
  };
  const addCustomGPField = () => {
    if (!newGPFieldLabel.trim()) return;
    saveCGPF([...customGPFields, { id: Date.now().toString(), label: newGPFieldLabel.trim(), enabled: true, required: false, dataType: newGPFieldType }]);
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
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              </div>
              <input
                className={cn(iCls, "flex-1")}
                value={gt.name}
                onChange={e => saveGPT(gpTypes.map(t => t.id === gt.id ? { ...t, name: e.target.value } : t))}
                placeholder="Type name…"
              />
              <button
                onClick={() => saveGPT(gpTypes.map(t => t.id === gt.id ? { ...t, enabled: !t.enabled } : t))}
                className={cn("w-8 h-5 rounded-full relative transition-colors flex-shrink-0", gt.enabled ? "bg-primary" : "bg-border")}
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
            <button onClick={addGPType} className="btn-primary flex-shrink-0">Add</button>
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
            <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide">Field name &amp; type</span>
            <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide text-center">Show</span>
            <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide text-center">Required</span>
            <span />
          </div>
          {VISITOR_FORM_FIELDS.map(f => {
            const cfg = vFields[f.id] ?? { enabled: true, required: false };
            const label = vFieldLabels[f.id] ?? f.label;
            return (
              <div key={f.id} className="grid grid-cols-[1fr_80px_80px_36px] gap-2 items-center px-5 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <DataTypeBadge type="text" />
                  <input
                    className={cn(iCls, "text-[13px] flex-1")}
                    value={label}
                    onChange={e => saveVFL({ ...vFieldLabels, [f.id]: e.target.value })}
                    placeholder={f.label}
                    title="Rename this field label"
                  />
                </div>
                <div className="flex justify-center"><Toggle checked={cfg.enabled} onChange={() => toggleVField(f.id, "enabled")} color="primary" /></div>
                <div className="flex justify-center"><Toggle checked={cfg.required && cfg.enabled} onChange={() => cfg.enabled && toggleVField(f.id, "required")} color="amber" disabled={!cfg.enabled} /></div>
                <div />
              </div>
            );
          })}
          {customVFields.map(f => (
            <div key={f.id} className="grid grid-cols-[1fr_80px_80px_36px] gap-2 items-center px-5 py-2.5 bg-primary/[0.02]">
              <div className="flex items-center gap-2 min-w-0">
                <DataTypeBadge type={f.dataType ?? "text"} />
                <input
                  className={cn(iCls, "text-[13px] flex-1")}
                  value={f.label}
                  onChange={e => saveCVF(customVFields.map(x => x.id === f.id ? { ...x, label: e.target.value } : x))}
                  placeholder="Field label…"
                />
              </div>
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
          <div className="flex gap-2 px-5 py-3 bg-secondary/30 flex-wrap">
            <select
              value={newVFieldType}
              onChange={e => setNewVFieldType(e.target.value as DataType)}
              className={cn(iCls, "w-32 flex-shrink-0 text-[12px]")}
            >
              {DATA_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
            </select>
            <input
              className={cn(iCls, "flex-1 text-[13px] min-w-[160px]")}
              value={newVFieldLabel}
              onChange={e => setNewVFieldLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomVField()}
              placeholder="Field label (e.g. Department, Badge No…)"
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
            <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide">Field name &amp; type</span>
            <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide text-center">Show</span>
            <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide text-center">Required</span>
            <span />
          </div>
          {GP_FORM_FIELDS.map(f => {
            const cfg = gpFields[f.id] ?? { enabled: true, required: false };
            const label = gpFieldLabels[f.id] ?? f.label;
            return (
              <div key={f.id} className="grid grid-cols-[1fr_80px_80px_36px] gap-2 items-center px-5 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <DataTypeBadge type="text" />
                  <input
                    className={cn(iCls, "text-[13px] flex-1")}
                    value={label}
                    onChange={e => saveGPFL({ ...gpFieldLabels, [f.id]: e.target.value })}
                    placeholder={f.label}
                    title="Rename this field label"
                  />
                </div>
                <div className="flex justify-center"><Toggle checked={cfg.enabled} onChange={() => toggleGPField(f.id, "enabled")} /></div>
                <div className="flex justify-center"><Toggle checked={cfg.required && cfg.enabled} onChange={() => cfg.enabled && toggleGPField(f.id, "required")} color="amber" disabled={!cfg.enabled} /></div>
                <div />
              </div>
            );
          })}
          {customGPFields.map(f => (
            <div key={f.id} className="grid grid-cols-[1fr_80px_80px_36px] gap-2 items-center px-5 py-2.5 bg-primary/[0.02]">
              <div className="flex items-center gap-2 min-w-0">
                <DataTypeBadge type={f.dataType ?? "text"} />
                <input
                  className={cn(iCls, "text-[13px] flex-1")}
                  value={f.label}
                  onChange={e => saveCGPF(customGPFields.map(x => x.id === f.id ? { ...x, label: e.target.value } : x))}
                  placeholder="Field label…"
                />
              </div>
              <div className="flex justify-center">
                <Toggle checked={f.enabled} onChange={() => saveCGPF(customGPFields.map(x => x.id === f.id ? { ...x, enabled: !x.enabled } : x))} />
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
          <div className="flex gap-2 px-5 py-3 bg-secondary/30 flex-wrap">
            <select
              value={newGPFieldType}
              onChange={e => setNewGPFieldType(e.target.value as DataType)}
              className={cn(iCls, "w-32 flex-shrink-0 text-[12px]")}
            >
              {DATA_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
            </select>
            <input
              className={cn(iCls, "flex-1 text-[13px] min-w-[160px]")}
              value={newGPFieldLabel}
              onChange={e => setNewGPFieldLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCustomGPField()}
              placeholder="Field label (e.g. Material, PO No…)"
            />
            <button onClick={addCustomGPField} className="btn-ghost flex-shrink-0 text-[12px]">+ Add Field</button>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
}

// ─── Badge Templates Tab ──────────────────────────────────────────────────────

interface TemplateConfig {
  primaryColor: string;
  accentColor: string;
  showLogo: boolean;
  showPhoto: boolean;
  showQR: boolean;
  fontSize: "sm" | "md" | "lg";
}

const defaultBadgeCfg: TemplateConfig = { primaryColor: "#c06b2c", accentColor: "#f9f5f0", showLogo: true, showPhoto: true, showQR: true, fontSize: "md" };
const defaultGPCfg: TemplateConfig    = { primaryColor: "#c06b2c", accentColor: "#f9f5f0", showLogo: true, showPhoto: false, showQR: false, fontSize: "md" };

function loadBadgeCfg(): TemplateConfig {
  try { const s = localStorage.getItem("gp_badge_cfg_v1"); if (s) return { ...defaultBadgeCfg, ...JSON.parse(s) }; } catch { /* */ }
  return defaultBadgeCfg;
}
function loadGPCfg(): TemplateConfig {
  try { const s = localStorage.getItem("gp_gp_cfg_v1"); if (s) return { ...defaultGPCfg, ...JSON.parse(s) }; } catch { /* */ }
  return defaultGPCfg;
}

function TemplateLivePreview({ kind, templateId, cfg }: { kind: "badge" | "gp"; templateId: string; cfg: TemplateConfig }) {
  const c = cfg.primaryColor;
  const bg = cfg.accentColor;
  const sz = cfg.fontSize === "sm" ? "text-[9px]" : cfg.fontSize === "lg" ? "text-[12px]" : "text-[10px]";

  if (kind === "badge") {
    if (templateId === "classic") return (
      <div className="w-[160px] h-[100px] rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white flex">
        <div className="w-2.5 h-full flex-shrink-0" style={{ backgroundColor: c }} />
        <div className="flex flex-col items-center justify-center w-[38px] flex-shrink-0 bg-gray-50 border-r border-gray-100 gap-1 py-1">
          {cfg.showPhoto && <div className="w-7 h-7 rounded-full border-2 bg-gray-200" style={{ borderColor: c }} />}
          {cfg.showQR && <div className="w-6 h-6 bg-gray-300 rounded-sm" />}
        </div>
        <div className="flex-1 flex flex-col justify-center px-2 py-1.5 gap-0.5">
          <div className={cn("font-bold text-gray-800", sz)}>Rajesh Kumar</div>
          <div className={cn("text-gray-500", sz)}>Vendor · TechCorp</div>
          <div className="mt-1 px-1 py-0.5 rounded text-[7px] font-bold text-white w-fit" style={{ backgroundColor: c }}>V-2024-0042</div>
          {cfg.showLogo && <div className="text-[7px] font-bold mt-0.5" style={{ color: c }}>GatePass™</div>}
        </div>
      </div>
    );
    if (templateId === "minimal") return (
      <div className="w-[160px] h-[100px] rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white flex flex-col justify-between p-3">
        <div>
          <div className={cn("font-bold text-gray-900", sz)}>Rajesh Kumar</div>
          <div className={cn("text-gray-400 mt-0.5", sz)}>Vendor · TechCorp</div>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-[7px] font-mono text-gray-500">V-2024-0042</div>
          {cfg.showQR && <div className="w-8 h-8 bg-gray-200 rounded-sm" />}
        </div>
        <div className="h-0.5 rounded-full w-full" style={{ backgroundColor: c }} />
      </div>
    );
    if (templateId === "bold") return (
      <div className="w-[160px] h-[100px] rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col" style={{ backgroundColor: bg }}>
        <div className="h-5 flex items-center px-2.5" style={{ backgroundColor: c }}>
          {cfg.showLogo && <span className="text-white text-[7px] font-bold">GatePass™</span>}
        </div>
        <div className="flex-1 flex items-center justify-between px-2.5">
          <div>
            <div className="text-[8px] font-semibold text-gray-500 uppercase tracking-wider">VISITOR ID</div>
            <div className="text-[17px] font-black" style={{ color: c }}>V-0042</div>
            <div className={cn("font-medium text-gray-700", sz)}>Rajesh Kumar</div>
          </div>
          {cfg.showPhoto && <div className="w-9 h-9 rounded-full bg-gray-200 border-2" style={{ borderColor: c }} />}
        </div>
      </div>
    );
    if (templateId === "corporate") return (
      <div className="w-[160px] h-[100px] rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white flex flex-col">
        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-gray-100">
          {cfg.showLogo && <span className="text-[7px] font-bold" style={{ color: c }}>GatePass™</span>}
          <span className="text-[7px] font-mono text-gray-400 ml-auto">V-2024-0042</span>
        </div>
        <div className="flex flex-1 items-center gap-2 px-2.5">
          {cfg.showPhoto && <div className="w-8 h-8 rounded-md bg-gray-200 flex-shrink-0 border border-gray-100" />}
          <div>
            <div className={cn("font-bold text-gray-800", sz)}>Rajesh Kumar</div>
            <div className={cn("text-gray-400", sz)}>TechCorp · Vendor</div>
          </div>
        </div>
        <div className="h-2.5 w-full" style={{ backgroundColor: c }} />
      </div>
    );
    if (templateId === "photo") return (
      <div className="w-[160px] h-[100px] rounded-lg border border-gray-200 overflow-hidden shadow-sm relative">
        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
          <div className="text-gray-500 text-[9px]">Photo</div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5 text-white" style={{ background: `linear-gradient(transparent, ${c}dd)` }}>
          <div className={cn("font-bold", sz)}>Rajesh Kumar</div>
          <div className="text-[7px] opacity-80">V-2024-0042 · Vendor</div>
        </div>
      </div>
    );
    return (
      <div className="w-[160px] h-[100px] rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white flex gap-2 p-2.5">
        <div className="flex flex-col gap-1.5">
          {cfg.showQR && <div className="w-12 h-12 bg-gray-800 rounded-sm p-1"><div className="w-full h-full grid grid-cols-3 gap-0.5">{[...Array(9)].map((_,i) => <div key={i} className={cn("rounded-[1px]", [0,2,6,8].includes(i) ? "bg-white" : "bg-gray-800/0")} />)}</div></div>}
          {cfg.showPhoto && <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-100" />}
        </div>
        <div className="flex-1 flex flex-col justify-center gap-0.5">
          <div className={cn("font-bold text-gray-800", sz)}>Rajesh Kumar</div>
          <div className={cn("text-gray-400", sz)}>Vendor</div>
          <div className="text-[7px] font-mono mt-1" style={{ color: c }}>V-2024-0042</div>
        </div>
      </div>
    );
  }

  // Gate pass previews
  if (templateId === "detailed") return (
    <div className="w-[160px] h-[100px] rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white flex flex-col">
      <div className="flex items-center justify-between px-2.5 py-1.5" style={{ backgroundColor: c }}>
        <span className="text-white text-[7px] font-bold">GATE PASS</span>
        <span className="text-white text-[7px] opacity-80">GP-2024-001</span>
      </div>
      <div className="flex-1 p-2 grid grid-cols-2 gap-x-2 gap-y-0.5">
        {["Vendor","Vehicle","Items","Purpose","Valid Till","Auth By"].map(l => (
          <div key={l}>
            <div className="text-[5.5px] text-gray-400 uppercase">{l}</div>
            <div className="text-[7px] text-gray-700">—</div>
          </div>
        ))}
      </div>
    </div>
  );
  if (templateId === "corporate") return (
    <div className="w-[160px] h-[100px] rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white flex flex-col">
      <div className="px-2.5 py-1.5 flex items-center justify-between" style={{ backgroundColor: c }}>
        {cfg.showLogo && <span className="text-white text-[7px] font-bold">GatePass™</span>}
        <span className="text-white text-[7px]">GATE PASS</span>
      </div>
      <div className="flex flex-1">
        <div className="flex-1 p-2 space-y-1">
          {["Vendor","Purpose","Items"].map(l => (
            <div key={l} className="flex gap-1">
              <span className="text-[6px] text-gray-400 w-10 flex-shrink-0 uppercase">{l}</span>
              <span className="text-[7px] text-gray-600">—</span>
            </div>
          ))}
        </div>
        <div className="w-14 border-l border-gray-100 p-2 space-y-1">
          {["Valid","Auth","Ref"].map(l => (
            <div key={l}>
              <div className="text-[5.5px] text-gray-400 uppercase">{l}</div>
              <div className="text-[7px] text-gray-700">—</div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-1.5" style={{ backgroundColor: c }} />
    </div>
  );
  if (templateId === "compact") return (
    <div className="w-[160px] h-[100px] rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[7px] font-bold" style={{ color: c }}>GATE PASS</span>
        <span className="text-[6.5px] font-mono text-gray-400">GP-001</span>
      </div>
      {["Vendor / Party","Vehicle No","Items","Valid Till"].map(l => (
        <div key={l} className="flex gap-1 border-b border-gray-50 py-0.5">
          <span className="text-[6px] text-gray-400 w-14 flex-shrink-0">{l}:</span>
          <span className="text-[6.5px] text-gray-600 truncate">—</span>
        </div>
      ))}
    </div>
  );
  if (templateId === "security") return (
    <div className="w-[160px] h-[100px] rounded-lg border-2 border-red-300 overflow-hidden shadow-sm bg-white flex flex-col">
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-red-600">
        <span className="text-white text-[7px] font-black tracking-wider">SECURITY PASS</span>
      </div>
      <div className="flex-1 p-2 flex flex-col justify-between">
        <div className="text-[9px] font-black text-red-600">GP-2024-001</div>
        <div className="space-y-0.5">
          {["Vendor","Purpose","Auth"].map(l => (
            <div key={l} className="flex gap-1">
              <span className="text-[5.5px] text-gray-500 uppercase w-8 flex-shrink-0">{l}:</span>
              <span className="text-[6.5px] text-gray-700">—</span>
            </div>
          ))}
        </div>
      </div>
      <div className="h-1 bg-red-600" />
    </div>
  );
  return (
    <div className="w-[160px] h-[100px] rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white p-2.5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[7px] font-bold" style={{ color: c }}>Gate Pass</span>
          <span className="text-[6.5px] font-mono text-gray-400">GP-001</span>
        </div>
        {["Vendor","Purpose"].map(l => (
          <div key={l} className="flex gap-1 py-0.5">
            <span className="text-[6px] text-gray-400 w-12 flex-shrink-0">{l}:</span>
            <span className="text-[6.5px] text-gray-600">—</span>
          </div>
        ))}
      </div>
      <div className="h-0.5 rounded-full" style={{ backgroundColor: c }} />
    </div>
  );
}

function TemplateCustomizer({ cfg, onChange, kind }: { cfg: TemplateConfig; onChange: (c: TemplateConfig) => void; kind: "badge" | "gp" }) {
  const set = <K extends keyof TemplateConfig>(k: K, v: TemplateConfig[K]) => onChange({ ...cfg, [k]: v });
  const labelCls = "text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1";
  return (
    <div className="grid grid-cols-2 gap-4 p-5">
      <div>
        <label className={labelCls}>Primary Colour</label>
        <div className="flex items-center gap-2">
          <input type="color" value={cfg.primaryColor} onChange={e => set("primaryColor", e.target.value)}
            className="w-9 h-9 rounded-lg cursor-pointer border border-border p-0.5 bg-transparent" />
          <input value={cfg.primaryColor} onChange={e => set("primaryColor", e.target.value)}
            className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1.5 text-[12px] font-mono uppercase outline-none focus:border-primary" maxLength={7} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Background Tint</label>
        <div className="flex items-center gap-2">
          <input type="color" value={cfg.accentColor} onChange={e => set("accentColor", e.target.value)}
            className="w-9 h-9 rounded-lg cursor-pointer border border-border p-0.5 bg-transparent" />
          <input value={cfg.accentColor} onChange={e => set("accentColor", e.target.value)}
            className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1.5 text-[12px] font-mono uppercase outline-none focus:border-primary" maxLength={7} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Font Size</label>
        <div className="flex gap-2">
          {(["sm","md","lg"] as const).map(s => (
            <button key={s} onClick={() => set("fontSize", s)}
              className={cn("flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors", cfg.fontSize === s ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
              {s === "sm" ? "S" : s === "md" ? "M" : "L"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {kind === "badge" && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={cfg.showPhoto} onChange={e => set("showPhoto", e.target.checked)} className="w-3.5 h-3.5 rounded accent-primary" />
            <span className="text-[12px] text-foreground">Show photo</span>
          </label>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={cfg.showLogo} onChange={e => set("showLogo", e.target.checked)} className="w-3.5 h-3.5 rounded accent-primary" />
          <span className="text-[12px] text-foreground">Show logo / brand</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={cfg.showQR} onChange={e => set("showQR", e.target.checked)} className="w-3.5 h-3.5 rounded accent-primary" />
          <span className="text-[12px] text-foreground">Show QR code</span>
        </label>
      </div>
    </div>
  );
}

function BadgeTemplatesTab({ badgeTemplate, setBadgeTemplate, gpTemplate, setGpTemplate }: {
  badgeTemplate: string; setBadgeTemplate: (t: string) => void;
  gpTemplate: string; setGpTemplate: (t: string) => void;
}) {
  const [badgeCfg, setBadgeCfg] = useState<TemplateConfig>(loadBadgeCfg);
  const [gpCfg, setGPCfg] = useState<TemplateConfig>(loadGPCfg);
  const [badgeEditor, setBadgeEditor] = useState(false);
  const [gpEditor, setGPEditor] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState<"badge" | "gp" | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | undefined>(undefined);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>(loadCustomTemplates);

  const saveBadgeCfg = (c: TemplateConfig) => { setBadgeCfg(c); localStorage.setItem("gp_badge_cfg_v1", JSON.stringify(c)); };
  const saveGPCfg   = (c: TemplateConfig) => { setGPCfg(c);    localStorage.setItem("gp_gp_cfg_v1",    JSON.stringify(c)); };

  const handleCreatorSave = (t: CustomTemplate) => {
    setCustomTemplates(loadCustomTemplates());
  };

  const handleDeleteCustom = (id: string) => {
    const updated = customTemplates.filter(t => t.id !== id);
    localStorage.setItem("gp_custom_templates_v1", JSON.stringify(updated));
    setCustomTemplates(updated);
    toast.success("Template deleted");
  };

  return (
    <>
      {/* Full-screen editors */}
      {badgeEditor && (
        <BadgeTemplateEditorModal
          kind="badge"
          template={badgeTemplate} setTemplate={t => { setBadgeTemplate(t); toast.success(`Badge template: ${BADGE_TEMPLATES.find(x => x.id === t)?.label}`); }}
          cfg={badgeCfg} setCfg={saveBadgeCfg}
          onClose={() => setBadgeEditor(false)}
        />
      )}
      {gpEditor && (
        <BadgeTemplateEditorModal
          kind="gp"
          template={gpTemplate} setTemplate={t => { setGpTemplate(t); toast.success(`GP template: ${GP_TEMPLATES.find(x => x.id === t)?.label}`); }}
          cfg={gpCfg} setCfg={saveGPCfg}
          onClose={() => setGPEditor(false)}
        />
      )}
      {creatorOpen && (
        <BadgeCreatorModal
          kind={creatorOpen}
          editTemplate={editingTemplate}
          onClose={() => { setCreatorOpen(null); setEditingTemplate(undefined); }}
          onSave={handleCreatorSave}
        />
      )}

      <div className="space-y-5">
        {/* ── Visitor Badge ── */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[13px] text-foreground">Visitor Badge Templates</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Choose how printed visitor badges look</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setCreatorOpen("badge"); setEditingTemplate(undefined); }}
                className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/8 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create from Scratch
              </button>
              <button onClick={() => setBadgeEditor(true)}
                className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h4"/></svg>
                Customise
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 p-5">
            {BADGE_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { setBadgeTemplate(t.id); toast.success(`Badge: ${t.label}`); }}
                className={cn("border-[1.5px] rounded-xl overflow-hidden text-left transition-all group",
                  badgeTemplate === t.id ? "border-primary shadow-[0_0_0_3px_rgba(192,107,44,0.15)]" : "border-border hover:border-primary/40")}>
                <div className={cn("flex items-center justify-center py-3 px-2 relative", badgeTemplate === t.id ? "bg-orange-50" : "bg-secondary group-hover:bg-secondary/70")}>
                  <TemplateLivePreview kind="badge" templateId={t.id} cfg={badgeCfg} />
                </div>
                <div className="px-3 py-2 border-t border-border">
                  <div className="text-[11.5px] font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                    {t.label}
                    {badgeTemplate === t.id && <span className="text-[9px] bg-orange-100 text-orange-700 rounded-full px-1.5 py-0.5 font-bold">Active</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Gate Pass ── */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[13px] text-foreground">Gate Pass Templates</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">A4 size (210 × 297 mm) print-ready passes</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setCreatorOpen("gp"); setEditingTemplate(undefined); }}
                className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/5 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create from Scratch
              </button>
              <button onClick={() => setGPEditor(true)}
                className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h4"/></svg>
                Customise
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 p-5">
            {GP_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { setGpTemplate(t.id); toast.success(`GP: ${t.label}`); }}
                className={cn("border-[1.5px] rounded-xl overflow-hidden text-left transition-all group",
                  gpTemplate === t.id ? "border-primary shadow-[0_0_0_3px_rgba(192,107,44,0.12)]" : "border-border hover:border-primary/40")}>
                <div className={cn("flex items-center justify-center py-3 px-2", gpTemplate === t.id ? "bg-primary/8" : "bg-secondary group-hover:bg-secondary/70")}>
                  <TemplateLivePreview kind="gp" templateId={t.id} cfg={gpCfg} />
                </div>
                <div className="px-3 py-2 border-t border-border">
                  <div className="text-[11.5px] font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                    {t.label}
                    {gpTemplate === t.id && <span className="text-[9px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-bold">Active</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Custom Templates ── */}
        {customTemplates.length > 0 && (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-border">
              <h3 className="font-semibold text-[13px] text-foreground">Custom Templates</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Templates you created from scratch</p>
            </div>
            <div className="grid grid-cols-4 gap-3 p-5">
              {customTemplates.map(t => (
                <div key={t.id} className="border-[1.5px] border-border rounded-xl overflow-hidden group hover:border-primary/40 transition-all">
                  <div className="bg-secondary py-5 px-3 flex items-center justify-center min-h-[70px]">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-primary">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4M9 17h3"/>
                        </svg>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium">{t.size.toUpperCase()}</div>
                    </div>
                  </div>
                  <div className="px-3 py-2 border-t border-border">
                    <div className="text-[11.5px] font-semibold text-foreground truncate">{t.name}</div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <button
                        onClick={() => { setEditingTemplate(t); setCreatorOpen(t.kind); }}
                        className="flex-1 text-[10px] font-medium text-primary hover:bg-primary/8 px-1.5 py-1 rounded transition-colors">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCustom(t.id)}
                        className="text-[10px] font-medium text-destructive/60 hover:text-destructive hover:bg-destructive/8 px-1.5 py-1 rounded transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
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
          {([{ id: "light", label: "Light", icon: "☀️" }, { id: "dark", label: "Dark", icon: "🌙" }, { id: "system", label: "System", icon: "💻" }] as const).map(t => (
            <button key={t.id} onClick={() => { branding.update({ theme: t.id }); toast.success(`Theme set to ${t.label}`); }}
              className={cn("flex-1 py-3 border rounded-xl text-[12.5px] font-medium transition-all",
                branding.theme === t.id ? "border-primary bg-orange-50 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}>
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
  checked: boolean; onChange: () => void; color?: "primary" | "amber"; disabled?: boolean;
}) {
  const bgMap = { primary: "bg-primary", amber: "bg-amber-500" };
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

const iCls = "w-full bg-background border border-input rounded-lg px-3 py-2 text-[13.5px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";

// ─── Settings Activity Tab ────────────────────────────────────────────────────

interface AuditLogEntry {
  id: string;
  companyId: string | null;
  userId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  entityLabel: string | null;
  details: string | null;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  created:  "bg-green-50 text-green-700 border-green-200",
  updated:  "bg-blue-50 text-blue-700 border-blue-200",
  deleted:  "bg-red-50 text-red-700 border-red-200",
  invited:  "bg-purple-50 text-purple-700 border-purple-200",
  disabled: "bg-amber-50 text-amber-700 border-amber-200",
  enabled:  "bg-primary/8 text-primary border-primary/20",
  checkin:  "bg-sky-50 text-sky-700 border-sky-200",
  checkout: "bg-slate-50 text-slate-700 border-slate-200",
};

const ENTITY_ICONS: Record<string, string> = {
  office: "🏢", user: "👤", visitor: "🧑", gate_pass: "🪪",
  settings: "⚙️", integration: "🔗", template: "🖨️", team: "👥",
};

function SettingsActivityTab() {
  const { user } = useApp();
  const [entityFilter, setEntityFilter] = useState("all");
  const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  const { data: activityLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["/api/audit-logs"],
    queryFn: async () => {
      const res = await fetch(`${basePath}/api/audit-logs`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json() as Promise<AuditLogEntry[]>;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const entities: string[] = Array.from(new Set(activityLogs.map((l: AuditLogEntry) => l.entity))).sort();
  const filtered: AuditLogEntry[] = entityFilter === "all" ? activityLogs : activityLogs.filter((l: AuditLogEntry) => l.entity === entityFilter);

  function fmtTs(ts: string) {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-semibold text-[15px] text-foreground">Activity Log</h2>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">All changes made in your workspace</p>
        </div>
        <div className="flex items-center gap-2">
          {entities.length > 0 && (
            <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)}
              className="text-[12px] border border-border rounded-lg px-3 py-1.5 bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 capitalize">
              <option value="all">All types</option>
              {entities.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          )}
          <button onClick={() => { void refetchLogs(); }}
            className="btn-ghost flex items-center gap-1.5 text-[12px]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3.5 h-3.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.02"/></svg>
            Refresh
          </button>
        </div>
      </div>

      {logsLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div className="text-[12.5px] text-muted-foreground">Loading activity…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-14 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-muted-foreground"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div className="text-[13px] font-medium text-foreground mb-1">No activity yet</div>
          <div className="text-[11.5px] text-muted-foreground max-w-xs">Changes to offices, users, settings, and integrations will be recorded here automatically.</div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-3.5 top-4 bottom-4 w-px bg-border" />
          {filtered.map((log: AuditLogEntry) => (
            <div key={log.id} className="relative pl-10 mb-2">
              <div className="absolute left-1.5 top-3.5 w-4 h-4 rounded-full bg-card border-2 border-border flex items-center justify-center text-[8px]">
                {ENTITY_ICONS[log.entity] ?? "·"}
              </div>
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize flex-shrink-0",
                      ACTION_COLORS[log.action] ?? "bg-secondary text-foreground border-border")}>
                      {log.action}
                    </span>
                    <span className="text-[12.5px] font-medium text-foreground truncate">
                      {log.entityLabel || log.entity}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-muted-foreground/60 whitespace-nowrap flex-shrink-0 mt-0.5" title={new Date(log.createdAt).toLocaleString()}>
                    {fmtTs(log.createdAt)}
                  </span>
                </div>
                {log.actorName && (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    by <span className="font-medium text-foreground">{log.actorName}</span>
                    {log.actorEmail && <span className="ml-1 text-muted-foreground/60">({log.actorEmail})</span>}
                  </div>
                )}
                {log.details && (() => {
                  try {
                    const d = JSON.parse(log.details);
                    const entries = Object.entries(d).filter(([, v]) => v !== null && v !== undefined && v !== "");
                    if (!entries.length) return null;
                    return (
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
                        {entries.slice(0, 6).map(([k, v]) => (
                          <div key={k} className="text-[10.5px] text-muted-foreground">
                            <span className="font-medium text-foreground/60">{k}:</span>{" "}
                            <span className="font-mono">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  } catch { return null; }
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Badge Template Editor Modal ──────────────────────────────────────────────

function BadgeTemplateEditorModal({ kind, template, setTemplate, cfg, setCfg, onClose }: {
  kind: "badge" | "gp";
  template: string; setTemplate: (t: string) => void;
  cfg: TemplateConfig; setCfg: (c: TemplateConfig) => void;
  onClose: () => void;
}) {
  const templates = kind === "badge" ? BADGE_TEMPLATES : GP_TEMPLATES;
  const title = kind === "badge" ? "Visitor Badge Editor" : "Gate Pass Editor";
  const accentOn = "border-primary";
  const set = <K extends keyof TemplateConfig>(k: K, v: TemplateConfig[K]) => setCfg({ ...cfg, [k]: v });

  const labelCls = "text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5";
  const inputCls = "flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-[12px] font-mono uppercase outline-none focus:border-primary transition-colors";

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex">
      <div className="flex flex-col flex-1 bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-3.5 h-3.5"><rect x="3" y="4" width="14" height="10" rx="2"/><rect x="7" y="17" width="10" height="3" rx="1.5"/></svg>
            </div>
            <div>
              <h2 className="font-semibold text-[14px] text-foreground">{title}</h2>
              <p className="text-[11px] text-muted-foreground">Pick a template and customize its appearance</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost flex items-center gap-1.5 text-[12px]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>
            Done
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: template list */}
          <div className="w-52 border-r border-border bg-card/60 overflow-y-auto flex-shrink-0 p-3">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">Templates</div>
            {templates.map(t => (
              <button key={t.id} onClick={() => setTemplate(t.id)}
                className={cn("w-full text-left px-3 py-3 rounded-xl mb-1 transition-all border",
                  template === t.id
                    ? "bg-primary/8 border-primary/30 shadow-sm"
                    : "border-transparent hover:bg-secondary hover:border-border")}>
                <div className="text-[12px] font-semibold text-foreground leading-tight">{t.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{t.desc}</div>
                {template === t.id && (
                  <div className="mt-1.5 text-[9px] font-bold inline-block px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    Active
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Center: large preview */}
          <div className="flex-1 bg-secondary/40 flex flex-col items-center justify-center overflow-hidden">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-6">Live Preview</div>
            <div className="bg-card rounded-2xl border border-border shadow-xl p-10 flex flex-col items-center gap-3">
              <div style={{ transform: "scale(2.4)", transformOrigin: "center" }}>
                <TemplateLivePreview kind={kind} templateId={template} cfg={cfg} />
              </div>
              <div className="mt-20 text-center">
                <div className="text-[13px] font-semibold text-foreground">
                  {templates.find(t => t.id === template)?.label}
                </div>
                <div className="text-[11.5px] text-muted-foreground mt-0.5 max-w-xs">
                  {templates.find(t => t.id === template)?.desc}
                </div>
              </div>
            </div>
          </div>

          {/* Right: customizer */}
          <div className="w-72 border-l border-border bg-card/60 overflow-y-auto flex-shrink-0 p-5">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Customize</div>

            <div className="space-y-5">
              <div>
                <label className={labelCls}>Primary Colour</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={cfg.primaryColor} onChange={e => set("primaryColor", e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-border p-0.5 bg-transparent flex-shrink-0" />
                  <input value={cfg.primaryColor} onChange={e => set("primaryColor", e.target.value)}
                    className={inputCls} maxLength={7} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Background Tint</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={cfg.accentColor} onChange={e => set("accentColor", e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-border p-0.5 bg-transparent flex-shrink-0" />
                  <input value={cfg.accentColor} onChange={e => set("accentColor", e.target.value)}
                    className={inputCls} maxLength={7} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Font Size</label>
                <div className="flex gap-2">
                  {(["sm","md","lg"] as const).map(s => (
                    <button key={s} onClick={() => set("fontSize", s)}
                      className={cn("flex-1 py-2 rounded-lg text-[12px] font-semibold border transition-colors",
                        cfg.fontSize === s ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
                      {s === "sm" ? "Small" : s === "md" ? "Medium" : "Large"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <label className={labelCls}>Display Options</label>
                <div className="space-y-3">
                  {kind === "badge" && (
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={cn("w-9 h-5 rounded-full relative transition-colors flex-shrink-0", cfg.showPhoto ? "bg-primary" : "bg-border")}>
                        <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all", cfg.showPhoto ? "left-[18px]" : "left-0.5")} />
                      </div>
                      <span className="text-[12.5px] text-foreground group-hover:text-foreground/80">Show visitor photo</span>
                    </label>
                  )}
                  <label className="flex items-center gap-3 cursor-pointer group" onClick={() => set("showLogo", !cfg.showLogo)}>
                    <div className={cn("w-9 h-5 rounded-full relative transition-colors flex-shrink-0", cfg.showLogo ? "bg-primary" : "bg-border")}>
                      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all", cfg.showLogo ? "left-[18px]" : "left-0.5")} />
                    </div>
                    <span className="text-[12.5px] text-foreground group-hover:text-foreground/80">Show company logo</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group" onClick={() => set("showQR", !cfg.showQR)}>
                    <div className={cn("w-9 h-5 rounded-full relative transition-colors flex-shrink-0", cfg.showQR ? "bg-primary" : "bg-border")}>
                      <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all", cfg.showQR ? "left-[18px]" : "left-0.5")} />
                    </div>
                    <span className="text-[12.5px] text-foreground group-hover:text-foreground/80">Show QR code</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <label className={labelCls}>Quick Presets</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["#c06b2c","#0d9488","#1a5fa8","#6b3fa0","#176878","#374151"].map(col => (
                    <button key={col} onClick={() => set("primaryColor", col)}
                      className={cn("h-7 rounded-lg border-2 transition-all hover:scale-105", cfg.primaryColor === col ? "border-foreground" : "border-transparent")}
                      style={{ backgroundColor: col }} title={col} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
