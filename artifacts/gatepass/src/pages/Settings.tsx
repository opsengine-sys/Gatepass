import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { VISITOR_TYPES, TYPE_COLORS, GP_TYPES } from "@/types";

type SettingsTab = "profile" | "team" | "badge-templates" | "visitor-types" | "notifications" | "integrations" | "appearance";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "team", label: "Team & Users" },
  { id: "badge-templates", label: "Badge Templates" },
  { id: "visitor-types", label: "Visitor Types" },
  { id: "notifications", label: "Notifications" },
  { id: "integrations", label: "Integrations" },
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

const ACCENT_SWATCHES = [
  "#c06b2c", "#1e7d3a", "#1a5fa8", "#6b3fa0",
  "#176878", "#8a6a0a", "#c0392b", "#2d3d2d",
];

const NOTIFICATION_TOGGLES = [
  { id: "checkin", label: "Visitor Check-in", desc: "Alert when a visitor checks in" },
  { id: "checkout", label: "Visitor Check-out", desc: "Alert when a visitor checks out" },
  { id: "gp_created", label: "Gate Pass Created", desc: "Alert when a new gate pass is issued" },
  { id: "gp_closed", label: "Gate Pass Closed", desc: "Alert when a gate pass is closed" },
  { id: "daily_summary", label: "Daily Summary", desc: "End-of-day visitor & pass report" },
  { id: "new_user", label: "New Team Member", desc: "Alert when someone joins the workspace" },
];

export function Settings() {
  const { user } = useApp();
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [badgeTemplate, setBadgeTemplate] = useState("classic");
  const [gpTemplate, setGpTemplate] = useState("minimal");
  const [accentColor, setAccentColor] = useState("#c06b2c");
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    checkin: true, checkout: true, gp_created: true,
    gp_closed: false, daily_summary: false, new_user: true,
  });

  const toggleNotif = (id: string) => {
    setNotifications(prev => ({ ...prev, [id]: !prev[id] }));
    toast.success("Notification preference saved");
  };

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <div className="max-w-[860px]">
      <div className="mb-5">
        <h1 className="font-serif text-[21px] font-medium text-foreground">Settings</h1>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">Manage your workspace preferences and configuration</p>
      </div>

      <div className="flex gap-1 bg-secondary border border-border rounded-xl p-1 w-fit mb-6 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium transition-all",
              tab === t.id
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileTab user={user} isAdmin={isAdmin} />}
      {tab === "team" && <TeamTab />}
      {tab === "badge-templates" && (
        <BadgeTemplatesTab
          badgeTemplate={badgeTemplate}
          setBadgeTemplate={setBadgeTemplate}
          gpTemplate={gpTemplate}
          setGpTemplate={setGpTemplate}
        />
      )}
      {tab === "visitor-types" && <VisitorTypesTab />}
      {tab === "notifications" && (
        <NotificationsTab notifications={notifications} onToggle={toggleNotif} />
      )}
      {tab === "integrations" && <IntegrationsTab />}
      {tab === "appearance" && (
        <AppearanceTab accentColor={accentColor} setAccentColor={setAccentColor} />
      )}
    </div>
  );
}

function ProfileTab({ user, isAdmin }: { user: ReturnType<typeof useApp>["user"]; isAdmin: boolean }) {
  const [name, setName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success("Profile saved");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card title="Your Profile">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name">
            <input className={iCls} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Email">
            <input className={iCls} value={user?.email ?? ""} readOnly placeholder="your@email.com"
              style={{ opacity: 0.7, cursor: "not-allowed" }} />
          </Field>
          <Field label="Role">
            <input className={iCls} value={formatRole(user?.role ?? "")} readOnly
              style={{ opacity: 0.7, cursor: "not-allowed" }} />
          </Field>
          <Field label="Company">
            <input className={iCls} value={user?.company?.name ?? "—"} readOnly
              style={{ opacity: 0.7, cursor: "not-allowed" }} />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSave} className="btn-primary">
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </Card>

      <Card title="Password & Security">
        <p className="text-[12.5px] text-muted-foreground mb-3">
          Password and security settings are managed through Clerk. Click below to manage your login security.
        </p>
        <button
          className="btn-ghost"
          onClick={() => toast.info("Open Clerk user profile to manage security settings")}
        >
          Manage Security Settings
        </button>
      </Card>

      {isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-[12px] text-blue-700 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          As an admin, you can manage team members and configuration settings from the Team & Users tab.
        </div>
      )}
    </div>
  );
}

function TeamTab() {
  const { user } = useApp();
  const [inviteEmail, setInviteEmail] = useState("");

  const handleInvite = () => {
    if (!inviteEmail.trim()) { toast.error("Enter an email address"); return; }
    toast.success(`Invite sent to ${inviteEmail}`);
    setInviteEmail("");
  };

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Card title="Invite Team Member">
          <div className="flex gap-2">
            <input
              className={cn(iCls, "flex-1")}
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInvite()}
            />
            <button className="btn-primary flex-shrink-0" onClick={handleInvite}>
              Send Invite
            </button>
          </div>
          <p className="text-[11.5px] text-muted-foreground mt-2">
            They'll receive an email with a link to join your GatePass workspace.
          </p>
        </Card>
      )}

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
                { role: "Admin", desc: "Manage users, offices, settings for the company", color: "bg-orange-50 text-orange-700" },
                { role: "Security", desc: "Check in/out visitors, manage gate passes", color: "bg-blue-50 text-blue-700" },
                { role: "Viewer", desc: "Read-only access to visitors and logs", color: "bg-slate-100 text-slate-600" },
              ].map(r => (
                <tr key={r.role} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <span className={cn("text-[10.5px] font-bold px-2 py-1 rounded-full", r.color)}>{r.role}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[12px] text-amber-700 flex items-start gap-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>Invited users are assigned the Viewer role by default. Admins can change roles after the user joins.</span>
      </div>
    </div>
  );
}

function BadgeTemplatesTab({ badgeTemplate, setBadgeTemplate, gpTemplate, setGpTemplate }: {
  badgeTemplate: string; setBadgeTemplate: (t: string) => void;
  gpTemplate: string; setGpTemplate: (t: string) => void;
}) {
  return (
    <div className="space-y-5">
      <Card title="Visitor Badge Templates">
        <div className="grid grid-cols-3 gap-3">
          {BADGE_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => { setBadgeTemplate(t.id); toast.success(`Badge template set to "${t.label}"`); }}
              className={cn(
                "border-[1.5px] rounded-xl overflow-hidden text-left transition-all",
                badgeTemplate === t.id
                  ? "border-primary shadow-[0_0_0_3px_rgba(192,107,44,0.15)]"
                  : "border-border hover:border-primary/40"
              )}
            >
              <div className={cn(
                "h-[88px] flex items-center justify-center",
                badgeTemplate === t.id ? "bg-orange-50" : "bg-secondary"
              )}>
                <BadgePreview id={t.id} active={badgeTemplate === t.id} />
              </div>
              <div className="px-3 py-2.5 border-t border-border">
                <div className="text-[12.5px] font-semibold text-foreground flex items-center gap-1.5">
                  {t.label}
                  {badgeTemplate === t.id && (
                    <span className="text-[10px] bg-orange-100 text-orange-700 rounded-full px-1.5 py-0.5 font-bold">Active</span>
                  )}
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
            <button
              key={t.id}
              onClick={() => { setGpTemplate(t.id); toast.success(`Gate pass template set to "${t.label}"`); }}
              className={cn(
                "border-[1.5px] rounded-xl overflow-hidden text-left transition-all",
                gpTemplate === t.id
                  ? "border-teal-500 shadow-[0_0_0_3px_rgba(20,184,166,0.12)]"
                  : "border-border hover:border-teal-400/40"
              )}
            >
              <div className={cn(
                "h-[88px] flex items-center justify-center",
                gpTemplate === t.id ? "bg-teal-50" : "bg-secondary"
              )}>
                <GPPreview id={t.id} active={gpTemplate === t.id} />
              </div>
              <div className="px-3 py-2.5 border-t border-border">
                <div className="text-[12.5px] font-semibold text-foreground flex items-center gap-1.5">
                  {t.label}
                  {gpTemplate === t.id && (
                    <span className="text-[10px] bg-teal-50 text-teal-700 rounded-full px-1.5 py-0.5 font-bold">Active</span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-[11.5px] text-blue-700 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Gate passes use A4 size (210mm × 297mm) for easy printing with full details.
        </div>
      </Card>
    </div>
  );
}

function VisitorTypesTab() {
  return (
    <div className="space-y-4">
      <Card title="Configured Visitor Types" bodyPad={false}>
        <div className="divide-y divide-border">
          {VISITOR_TYPES.map(type => {
            const color = TYPE_COLORS[type] ?? "#445368";
            return (
              <div key={type} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="flex-1 text-[13px] font-medium text-foreground">{type}</span>
                <span
                  className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: color + "18", color }}
                >
                  Active
                </span>
              </div>
            );
          })}
        </div>
      </Card>
      <Card title="Gate Pass Types" bodyPad={false}>
        <div className="divide-y divide-border">
          {GP_TYPES.map(type => (
            <div key={type} className="flex items-center gap-3 px-4 py-3">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-teal-600" />
              <span className="flex-1 text-[13px] font-medium text-foreground">{type}</span>
              <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">Active</span>
            </div>
          ))}
        </div>
      </Card>
      <div className="bg-secondary border border-border rounded-xl px-4 py-3 text-[12px] text-muted-foreground flex items-center gap-2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Custom visitor types and field configuration coming in a future update.
      </div>
    </div>
  );
}

function NotificationsTab({ notifications, onToggle }: {
  notifications: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
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
              <button
                onClick={() => onToggle(n.id)}
                className={cn(
                  "w-9 h-5 rounded-full relative transition-colors flex-shrink-0",
                  notifications[n.id] ? "bg-primary" : "bg-border"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all",
                  notifications[n.id] ? "left-[18px]" : "left-0.5"
                )} />
              </button>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Email Notifications">
        <p className="text-[12.5px] text-muted-foreground mb-3">
          Email notification delivery is managed through your workspace email settings. Configure your SMTP settings or connect an email provider below.
        </p>
        <button className="btn-ghost" onClick={() => toast.info("Email integration coming soon")}>
          Configure Email
        </button>
      </Card>
    </div>
  );
}

function IntegrationsTab() {
  const [msEnabled, setMsEnabled] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-[12px] text-blue-700 flex items-start gap-2 mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0 mt-0.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>Integrations allow single sign-on and cloud data sync. Enable an integration to let users log in with their company accounts.</span>
      </div>

      <IntCard
        name="Microsoft 365 / Azure AD"
        desc="Single sign-on · SharePoint data storage · Teams notifications"
        enabled={msEnabled}
        onToggle={() => { setMsEnabled(p => !p); toast.success(msEnabled ? "Microsoft integration disabled" : "Microsoft integration enabled"); }}
        logo={
          <svg width="22" height="22" viewBox="0 0 23 23" fill="none">
            <path fill="#f25022" d="M1 1h10v10H1z"/>
            <path fill="#7fba00" d="M12 1h10v10H12z"/>
            <path fill="#00a4ef" d="M1 12h10v10H1z"/>
            <path fill="#ffb900" d="M12 12h10v10H12z"/>
          </svg>
        }
      />

      <IntCard
        name="Google Workspace"
        desc="Single sign-on · Google Sheets storage · Google Calendar"
        enabled={googleEnabled}
        onToggle={() => { setGoogleEnabled(p => !p); toast.success(googleEnabled ? "Google integration disabled" : "Google integration enabled"); }}
        logo={
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        }
      />

      <div className="flex items-center gap-4 px-4 py-3.5 border border-border rounded-xl bg-card opacity-55">
        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" className="w-5 h-5">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-foreground">LDAP / Active Directory</div>
          <div className="text-[11.5px] text-muted-foreground">On-premise directory integration</div>
        </div>
        <span className="text-[10.5px] font-bold px-2 py-1 rounded-full bg-secondary text-muted-foreground">Coming Soon</span>
      </div>
    </div>
  );
}

function AppearanceTab({ accentColor, setAccentColor }: {
  accentColor: string;
  setAccentColor: (c: string) => void;
}) {
  const [font, setFont] = useState("Plus Jakarta Sans");

  const handleColorChange = (c: string) => {
    setAccentColor(c);
    toast.success("Accent color updated — full theming coming soon");
  };

  return (
    <div className="space-y-4">
      <Card title="Accent Color">
        <p className="text-[12.5px] text-muted-foreground mb-3">
          Choose a primary accent color for badges, buttons, and UI highlights.
        </p>
        <div className="flex items-center gap-2.5 flex-wrap">
          {ACCENT_SWATCHES.map(c => (
            <button
              key={c}
              onClick={() => handleColorChange(c)}
              className={cn(
                "w-7 h-7 rounded-md border-2 transition-all",
                accentColor === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={accentColor}
            onChange={e => handleColorChange(e.target.value)}
            className="w-7 h-7 rounded-md border border-border cursor-pointer p-0 bg-transparent"
          />
          <div
            className="w-7 h-7 rounded-md border border-border flex-shrink-0"
            style={{ backgroundColor: accentColor }}
          />
        </div>
      </Card>

      <Card title="Font Family">
        <p className="text-[12.5px] text-muted-foreground mb-3">
          Select the interface font. Applied across all screens, badges, and reports.
        </p>
        <select
          className={cn(iCls, "max-w-xs")}
          value={font}
          onChange={e => { setFont(e.target.value); toast.success("Font updated"); }}
        >
          {["Plus Jakarta Sans", "Inter", "Roboto", "Open Sans", "Poppins", "DM Sans"].map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </Card>

      <Card title="Theme">
        <div className="flex gap-3">
          {[
            { id: "light", label: "Light", icon: "☀️" },
            { id: "dark", label: "Dark", icon: "🌙" },
            { id: "system", label: "System", icon: "💻" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => toast.info("Theme switching coming soon")}
              className={cn(
                "flex-1 py-3 border rounded-xl text-[12.5px] font-medium transition-all",
                t.id === "light"
                  ? "border-primary bg-orange-50 text-primary"
                  : "border-border hover:border-border/80 text-muted-foreground"
              )}
            >
              <div className="text-lg mb-1">{t.icon}</div>
              {t.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function IntCard({ name, desc, enabled, onToggle, logo }: {
  name: string; desc: string; enabled: boolean;
  onToggle: () => void; logo: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border border-border rounded-xl bg-card hover:border-border/80 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">{logo}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-foreground">{name}</div>
        <div className="text-[11.5px] text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <button
          onClick={onToggle}
          className={cn("w-9 h-5 rounded-full relative transition-colors", enabled ? "bg-primary" : "bg-border")}
        >
          <span className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all",
            enabled ? "left-[18px]" : "left-0.5"
          )} />
        </button>
        <span className={cn("text-[10px] font-medium", enabled ? "text-green-600" : "text-muted-foreground")}>
          {enabled ? "Connected" : "Disabled"}
        </span>
      </div>
    </div>
  );
}

function BadgePreview({ id, active }: { id: string; active: boolean }) {
  const color = active ? "#c06b2c" : "#9aaa9a";
  if (id === "classic") return (
    <div className="flex flex-col items-center gap-1 py-2">
      <div className="w-8 h-1.5 rounded-sm" style={{ backgroundColor: color }} />
      <div className="w-8 h-8 rounded-full border-2" style={{ borderColor: color + "44", background: "#f4f6f4" }} />
      <div className="w-12 h-1 rounded" style={{ backgroundColor: color + "aa" }} />
      <div className="w-8 h-0.5 rounded" style={{ backgroundColor: "#e0d8d0" }} />
    </div>
  );
  if (id === "minimal") return (
    <div className="flex flex-col gap-1 py-2 px-3">
      <div className="w-10 h-1.5 rounded" style={{ backgroundColor: color + "aa" }} />
      <div className="w-7 h-1 rounded" style={{ backgroundColor: "#e0d8d0" }} />
      <div className="w-12 h-2 rounded mt-1" style={{ backgroundColor: color + "22" }} />
      <div className="w-8 h-0.5 rounded" style={{ backgroundColor: "#e0d8d0" }} />
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <div className="text-[22px] font-black" style={{ color }}>ID</div>
      <div className="w-12 h-1 rounded" style={{ backgroundColor: color + "55" }} />
    </div>
  );
}

function GPPreview({ id, active }: { id: string; active: boolean }) {
  const color = active ? "#0d9488" : "#9aaa9a";
  if (id === "detailed") return (
    <div className="grid grid-cols-2 gap-1 p-3 w-full max-w-[80px]">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-3 rounded" style={{ backgroundColor: color + "33" }} />
      ))}
    </div>
  );
  if (id === "compact") return (
    <div className="flex flex-col gap-1.5 p-3">
      {[1,2,3].map(i => <div key={i} className="h-1.5 rounded" style={{ backgroundColor: color + "55", width: `${60 + i * 10}%` }} />)}
    </div>
  );
  return (
    <div className="flex flex-col gap-1.5 p-3">
      <div className="h-1.5 rounded" style={{ backgroundColor: color + "55", width: "80%" }} />
      <div className="h-1.5 rounded" style={{ backgroundColor: color + "33", width: "60%" }} />
      <div className="h-2.5 rounded mt-1" style={{ backgroundColor: color + "22" }} />
    </div>
  );
}

function Card({ title, children, bodyPad = true }: {
  title: string; children: React.ReactNode; bodyPad?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="font-bold text-[13px] text-foreground">{title}</h3>
      </div>
      <div className={bodyPad ? "p-5" : ""}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function formatRole(role: string) {
  return { super_admin: "Super Admin", admin: "Admin", security: "Security Officer", viewer: "Viewer" }[role] ?? role;
}

const iCls = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-[13.5px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
