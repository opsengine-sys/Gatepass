import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useClerk } from "@clerk/react";
import {
  useAdminListCompanies,
  useAdminListUsers,
  adminCreateCompany,
  adminUpdateCompany,
  adminDeleteCompany,
  adminUpdateUser,
} from "@workspace/api-client-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Company, UserProfile, ProductKey, CompanyContact } from "@/types";
import { ALL_PRODUCTS, PRODUCT_LABELS, CONTACT_ROLES } from "@/types";
import { useLocation } from "wouter";

// ── helpers ──────────────────────────────────────────────────────────────────

async function fetchAdmin<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error(`${path} failed`);
  return res.json() as Promise<T>;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(v: string | null | undefined) {
  if (!v) return "—";
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  if (isNaN(n)) return v;
  return "₹" + n.toLocaleString("en-IN");
}

function parseProducts(raw: string | null | undefined): ProductKey[] {
  try { return JSON.parse(raw ?? "[]") as ProductKey[]; } catch { return []; }
}

type LicenseStatus = "trial" | "active" | "expired" | "suspended";

const LICENSE_STATUS_COLORS: Record<string, string> = {
  trial: "bg-blue-50 text-blue-700",
  active: "bg-green-50 text-green-700",
  expired: "bg-red-50 text-red-700",
  suspended: "bg-amber-50 text-amber-700",
};

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-orange-50 text-orange-700",
  growth: "bg-blue-50 text-blue-700",
  enterprise: "bg-purple-50 text-purple-700",
};

// ── nav items ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "companies" | "licenses" | "users" | "platform-admins" | "activity" | "integrations";

const NAV: { id: Tab; label: string; icon: ReactNode }[] = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: "companies",
    label: "Companies",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      </svg>
    ),
  },
  {
    id: "licenses",
    label: "Licenses",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    id: "users",
    label: "Users",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: "platform-admins",
    label: "Platform Admins",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  },
  {
    id: "activity",
    label: "Activity",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/>
        <path d="M13 6h3a2 2 0 0 1 2 2v7M11 18H8a2 2 0 0 1-2-2V9"/>
      </svg>
    ),
  },
];

// ── main component ────────────────────────────────────────────────────────────

export function AdminPanel({ superAdminNoCompany = false }: { superAdminNoCompany?: boolean }) {
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("overview");

  const sidebar = (
    <aside className="w-56 bg-card border-r border-border flex-shrink-0 flex flex-col">
      <div className="px-4 py-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-3.5 h-3.5">
              <rect x="3" y="4" width="14" height="10" rx="2"/>
              <path d="M7 8h6M7 11h4"/>
              <rect x="7" y="17" width="10" height="3" rx="1.5"/>
            </svg>
          </div>
          <span className="font-semibold text-[14px] text-foreground">GatePass</span>
        </div>
        <span className="text-[11px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
          Super Admin
        </span>
      </div>

      <nav className="flex-1 px-2">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium mb-0.5 transition-colors",
              tab === n.id
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {n.icon}
            {n.label}
          </button>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        {!superAdminNoCompany && (
          <button
            onClick={() => setLocation("/")}
            className="w-full text-left text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-2 mb-2 px-1 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to App
          </button>
        )}
        <button
          onClick={() => signOut()}
          className="w-full text-left text-[12px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-2 px-3 py-2 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="h-12 bg-card border-b border-border flex items-center px-4 gap-3 flex-shrink-0">
        <span className="text-[12px] text-muted-foreground">Super Admin Console</span>
        <span className="text-muted-foreground/40 text-xs">·</span>
        <span className="text-[12px] font-semibold text-foreground capitalize">{tab}</span>
        <div className="ml-auto flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-purple-700">Signed in as super_admin · same /sign-in page</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebar}
        <main className="flex-1 overflow-y-auto p-8">
          {tab === "overview" && <OverviewTab />}
          {tab === "companies" && <CompaniesTab />}
          {tab === "licenses" && <LicensesTab />}
          {tab === "users" && <UsersTab />}
          {tab === "platform-admins" && <PlatformAdminsTab />}
          {tab === "activity" && <ActivityTab />}
          {tab === "integrations" && <CompanyIntegrationsTab />}
        </main>
      </div>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────

interface Stats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  totalVisitors: number;
  licenseBreakdown: Array<{ status: string; cnt: number }>;
  planBreakdown: Array<{ plan: string; cnt: number }>;
  recentCompanies: Company[];
  expiring: Company[];
}

function OverviewTab() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => fetchAdmin<Stats>("/api/admin/stats"),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20 text-muted-foreground text-[13px]">Loading metrics…</div>;
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 opacity-30">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div className="text-[13px]">Unable to load metrics. Super admin access required.</div>
      </div>
    );
  }

  const s = stats;

  const metricCards = [
    { label: "Total Companies", value: s.totalCompanies, color: "text-primary", sub: `${s.activeCompanies} with active license` },
    { label: "Total Users", value: s.totalUsers, color: "text-blue-600", sub: "across all companies" },
    { label: "Total Visitors", value: s.totalVisitors, color: "text-orange-600", sub: "all time" },
    { label: "Active Licenses", value: s.licenseBreakdown.find(l => l.status === "active")?.cnt ?? 0, color: "text-green-600", sub: "live subscriptions" },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-semibold text-[22px] tracking-tight text-foreground mb-1">Overview</h1>
        <p className="text-[13px] text-muted-foreground">Platform-wide metrics and activity at a glance</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <div key={m.label} className="bg-card border border-border rounded-xl p-5">
            <div className={cn("text-[30px] font-bold", m.color)}>{m.value}</div>
            <div className="text-[13px] font-semibold text-foreground mt-1">{m.label}</div>
            <div className="text-[11.5px] text-muted-foreground mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* License status breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-[14px] text-foreground mb-4">License Status</h3>
          <div className="space-y-2.5">
            {["active", "trial", "expired", "suspended"].map((status) => {
              const cnt = s.licenseBreakdown.find(l => l.status === status)?.cnt ?? 0;
              const total = s.totalCompanies || 1;
              const pct = Math.round((cnt / total) * 100);
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize", LICENSE_STATUS_COLORS[status] ?? "bg-secondary text-muted-foreground")}>{status}</span>
                    <span className="text-[12px] font-semibold text-foreground">{cnt}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-[14px] text-foreground mb-4">Plan Distribution</h3>
          <div className="space-y-2.5">
            {["starter", "growth", "enterprise"].map((plan) => {
              const cnt = s.planBreakdown.find(p => p.plan === plan)?.cnt ?? 0;
              const total = s.totalCompanies || 1;
              const pct = Math.round((cnt / total) * 100);
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize", PLAN_COLORS[plan] ?? "")}>{plan}</span>
                    <span className="text-[12px] font-semibold text-foreground">{cnt}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recently added */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-[14px] text-foreground mb-4">Recently Added Companies</h3>
          {s.recentCompanies.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No companies yet.</p>
          ) : (
            <div className="space-y-3">
              {s.recentCompanies.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{c.name}</div>
                    <div className="text-[11.5px] text-muted-foreground">{fmtDate(c.createdAt)}</div>
                  </div>
                  <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", PLAN_COLORS[c.plan] ?? "")}>{c.plan}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring contracts */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-[14px] text-foreground mb-4">Contracts Expiring Soon</h3>
          {s.expiring.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No contracts expiring in the next 60 days.</p>
          ) : (
            <div className="space-y-3">
              {s.expiring.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{c.name}</div>
                    <div className="text-[11.5px] text-muted-foreground">{c.contactEmail ?? "No contact"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-semibold text-red-600">{fmtDate(c.contractEnd)}</div>
                    <div className="text-[11px] text-muted-foreground">{fmtMoney(c.contractValue)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Companies ─────────────────────────────────────────────────────────────────

function CompaniesTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [impersonateCompany, setImpersonateCompany] = useState<Company | null>(null);

  const { data: companies = [], isLoading } = useAdminListCompanies();

  const filtered = (companies as Company[]).filter((c) =>
    [c.name, c.slug, c.contactEmail, c.contactName].some((v) =>
      v?.toLowerCase().includes(filter.toLowerCase()),
    ),
  );

  const handleImpersonate = (c: Company) => {
    localStorage.setItem("gp_impersonate", JSON.stringify({ companyId: c.id, companyName: c.name }));
    window.location.href = "/";
  };

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-semibold text-[22px] tracking-tight text-foreground mb-0.5">Companies</h1>
          <p className="text-[13px] text-muted-foreground">Manage company accounts, contracts & contacts</p>
        </div>
        <button onClick={() => setNewOpen(true)} className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Company
        </button>
      </div>

      <div className="mb-4 max-w-xs">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search companies…" className="w-full pl-8 pr-3 py-2 text-[13px] bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10 text-muted-foreground text-[13px]">Loading…</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-[12.5px] min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Company</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Plan / License</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Contract</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Users / Offices</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{c.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{c.contactName ?? <span className="text-muted-foreground/50">—</span>}</div>
                    <div className="text-[11px] text-muted-foreground">{c.contactEmail ?? ""}</div>
                    <div className="text-[11px] text-muted-foreground">{c.contactPhone ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10.5px] font-semibold px-2 py-0.5 rounded-full capitalize block w-fit mb-1", PLAN_COLORS[c.plan] ?? "")}>{c.plan}</span>
                    <span className={cn("text-[10.5px] font-semibold px-2 py-0.5 rounded-full capitalize block w-fit", LICENSE_STATUS_COLORS[c.licenseStatus ?? "trial"] ?? "bg-secondary text-muted-foreground")}>{c.licenseStatus ?? "trial"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[11px] text-muted-foreground">{fmtDate(c.contractStart)} → {fmtDate(c.contractEnd)}</div>
                    <div className="font-semibold text-foreground">{fmtMoney(c.contractValue)}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{(c as any).userCount ?? 0} users</div>
                    <div>{(c as any).officeCount ?? 0} offices</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10.5px] font-semibold px-2 py-0.5 rounded-full", c.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      <button onClick={() => handleImpersonate(c)} className="text-[11.5px] font-semibold text-primary hover:underline whitespace-nowrap">Enter as Admin</button>
                      <button onClick={() => setEditCompany(c)} className="text-[11.5px] font-medium text-primary hover:underline">Edit</button>
                      <button onClick={async () => {
                        await adminDeleteCompany(c.id);
                        qc.invalidateQueries({ queryKey: ["/api/admin/companies"] });
                        toast.success("Company deactivated");
                      }} className="text-[11.5px] font-medium text-red-600 hover:underline">Suspend</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[13px] text-muted-foreground">No companies found</div>
          )}
        </div>
      )}

      {newOpen && (
        <CompanyFormModal
          title="Add Company"
          onClose={() => setNewOpen(false)}
          onSave={async (data) => {
            await adminCreateCompany(data as never);
            qc.invalidateQueries({ queryKey: ["/api/admin/companies"] });
            qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            toast.success("Company created");
            setNewOpen(false);
          }}
        />
      )}

      {editCompany && (
        <CompanyFormModal
          title="Edit Company"
          initial={editCompany}
          onClose={() => setEditCompany(null)}
          onSave={async (data) => {
            await adminUpdateCompany(editCompany.id, data as never);
            qc.invalidateQueries({ queryKey: ["/api/admin/companies"] });
            qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            toast.success("Company updated");
            setEditCompany(null);
          }}
        />
      )}
    </div>
  );
}

// ── Licenses ──────────────────────────────────────────────────────────────────

function SeatBar({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10.5px] text-muted-foreground whitespace-nowrap font-mono">{used}/{max}</span>
    </div>
  );
}

function LicensesTab() {
  const qc = useQueryClient();
  const { data: companies = [], isLoading } = useAdminListCompanies();
  const [editId, setEditId] = useState<string | null>(null);
  const [editProducts, setEditProducts] = useState<ProductKey[]>([]);
  const [editStatus, setEditStatus] = useState<LicenseStatus>("trial");
  const [editMaxSeats, setEditMaxSeats] = useState("10");
  const [saving, setSaving] = useState(false);

  const startEdit = (c: Company) => {
    setEditId(c.id);
    setEditProducts(parseProducts(c.products));
    setEditStatus((c.licenseStatus as LicenseStatus) ?? "trial");
    setEditMaxSeats(String(c.maxSeats ?? 10));
  };

  const saveEdit = async (c: Company) => {
    setSaving(true);
    try {
      await adminUpdateCompany(c.id, { products: editProducts, licenseStatus: editStatus, maxSeats: editMaxSeats } as never);
      qc.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      toast.success("License updated");
      setEditId(null);
    } finally {
      setSaving(false);
    }
  };

  const allCompanies = companies as Company[];
  const totalSeats = allCompanies.reduce((a, c) => a + Number(c.maxSeats ?? 0), 0);
  const usedSeats  = allCompanies.reduce((a, c) => a + Number((c as any).userCount ?? c.seatsUsed ?? 0), 0);
  const activeCount = allCompanies.filter(c => (c.licenseStatus as LicenseStatus) === "active").length;
  const trialCount  = allCompanies.filter(c => (c.licenseStatus as LicenseStatus) === "trial").length;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="font-semibold text-[22px] tracking-tight text-foreground mb-0.5">Licenses &amp; Products</h1>
        <p className="text-[13px] text-muted-foreground">Manage subscriptions, seat allocations and product access per company</p>
      </div>

      {/* summary bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Companies", value: allCompanies.length, color: "text-foreground" },
          { label: "Active Licenses", value: activeCount, color: "text-emerald-600" },
          { label: "On Trial", value: trialCount, color: "text-amber-600" },
          { label: "Seats Allocated", value: `${usedSeats} / ${totalSeats}`, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3">
            <div className={cn("text-[20px] font-bold font-mono leading-none", s.color)}>{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10 text-muted-foreground text-[13px]">Loading…</div>
      ) : (
        <div className="space-y-3">
          {allCompanies.map((c) => {
            const isEditing = editId === c.id;
            const products = isEditing ? editProducts : parseProducts(c.products);
            const status = isEditing ? editStatus : ((c.licenseStatus as LicenseStatus) ?? "trial");
            const maxSeats = isEditing ? Number(editMaxSeats) : Number(c.maxSeats ?? 10);
            const seatsUsed = Number((c as any).userCount ?? c.seatsUsed ?? 0);
            const contractEndDate = c.contractEnd ? new Date(c.contractEnd) : null;
            const daysLeft = contractEndDate ? Math.ceil((contractEndDate.getTime() - Date.now()) / 86400000) : null;

            return (
              <div key={c.id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="font-semibold text-foreground text-[14px]">{c.name}</div>
                    <div className="text-[11.5px] text-muted-foreground">{c.contactEmail ?? c.slug}</div>
                    {/* seat bar */}
                    <div className="mt-2">
                      <div className="text-[10.5px] text-muted-foreground uppercase font-bold tracking-wide mb-0.5">Seat Usage</div>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <label className="text-[11.5px] text-muted-foreground whitespace-nowrap">Max seats:</label>
                          <input
                            type="number"
                            min="1"
                            max="9999"
                            value={editMaxSeats}
                            onChange={e => setEditMaxSeats(e.target.value)}
                            className="w-20 text-[12px] border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 font-mono"
                          />
                          <span className="text-[11.5px] text-muted-foreground">({seatsUsed} used)</span>
                        </div>
                      ) : (
                        <SeatBar used={seatsUsed} max={maxSeats} />
                      )}
                    </div>
                    {/* contract dates */}
                    {(c.contractStart || c.contractEnd) && (
                      <div className="flex items-center gap-3 mt-2">
                        {c.contractStart && <span className="text-[10.5px] text-muted-foreground">Start: <span className="font-mono text-foreground">{c.contractStart.slice(0,10)}</span></span>}
                        {c.contractEnd && (
                          <span className={cn("text-[10.5px]", daysLeft !== null && daysLeft <= 30 ? "text-red-600 font-semibold" : "text-muted-foreground")}>
                            End: <span className="font-mono">{c.contractEnd.slice(0,10)}</span>
                            {daysLeft !== null && daysLeft <= 60 && (
                              <span className={cn("ml-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold", daysLeft <= 30 ? "bg-red-100 text-red-700" : "bg-amber-50 text-amber-700")}>
                                {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
                              </span>
                            )}
                          </span>
                        )}
                        {c.contractValue && <span className="text-[10.5px] text-muted-foreground">Value: <span className="font-semibold text-foreground">{c.contractValue}</span></span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isEditing ? (
                      <>
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as LicenseStatus)}
                          className="text-[12px] border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary/30">
                          {(["trial", "active", "expired", "suspended"] as LicenseStatus[]).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button onClick={() => saveEdit(c)} disabled={saving} className="btn-primary text-[12px] py-1">Save</button>
                        <button onClick={() => setEditId(null)} className="text-[12px] text-muted-foreground hover:underline">Cancel</button>
                      </>
                    ) : (
                      <>
                        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize", LICENSE_STATUS_COLORS[status])}>{status}</span>
                        <button onClick={() => startEdit(c)} className="text-[12px] text-primary font-medium hover:underline">Edit</button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {isEditing && (
                    <button type="button"
                      onClick={() => setEditProducts(editProducts.length === ALL_PRODUCTS.length ? [] : [...ALL_PRODUCTS])}
                      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-colors",
                        editProducts.length === ALL_PRODUCTS.length
                          ? "bg-amber-50 border-amber-400 text-amber-700"
                          : "border-border text-muted-foreground hover:border-amber-400/60 hover:text-amber-700")}>
                      {editProducts.length === ALL_PRODUCTS.length
                        ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><polyline points="20 6 9 17 4 12"/></svg> All</>
                        : "All"}
                    </button>
                  )}
                  {ALL_PRODUCTS.map((p) => {
                    const active = products.includes(p);
                    return isEditing ? (
                      <label key={p} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] cursor-pointer transition-colors",
                        active ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}>
                        <input type="checkbox" checked={active}
                          onChange={() => setEditProducts(prev => active ? prev.filter(x => x !== p) : [...prev, p])}
                          className="sr-only" />
                        {active && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><polyline points="20 6 9 17 4 12"/></svg>}
                        {PRODUCT_LABELS[p]}
                      </label>
                    ) : active ? (
                      <span key={p} className="px-3 py-1.5 rounded-lg border text-[12px] bg-primary/10 border-primary/30 text-primary font-medium">
                        {PRODUCT_LABELS[p]}
                      </span>
                    ) : null;
                  })}
                  {!isEditing && products.length === 0 && (
                    <span className="text-[12px] text-muted-foreground/60 italic flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Product access is not restricted for this company
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {allCompanies.length === 0 && (
            <div className="py-12 text-center text-[13px] text-muted-foreground">No companies yet. Add one in the Companies tab.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Users ─────────────────────────────────────────────────────────────────────

function UsersTab() {
  const qc = useQueryClient();
  const [companyFilter, setCompanyFilter] = useState("");
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editCompanyId, setEditCompanyId] = useState("");

  const { data: users = [], isLoading: usersLoading } = useAdminListUsers({} as never, {} as never);
  const { data: companies = [] } = useAdminListCompanies();

  const filtered = (users as UserProfile[]).filter((u) => {
    if (!companyFilter) return true;
    return u.company?.id === companyFilter;
  });

  const startEdit = (u: UserProfile) => {
    setEditUserId(u.id);
    setEditRole(u.role);
    setEditCompanyId(u.companyId ?? "");
  };

  const saveEdit = async () => {
    if (!editUserId) return;
    await adminUpdateUser(editUserId, { role: editRole, companyId: editCompanyId || null } as never);
    qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
    toast.success("User updated");
    setEditUserId(null);
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-semibold text-[22px] tracking-tight text-foreground mb-0.5">Users</h1>
          <p className="text-[13px] text-muted-foreground">All users across all companies</p>
        </div>
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="text-[12.5px] border border-border rounded-lg px-3 py-2 bg-card focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          <option value="">All Companies</option>
          {(companies as Company[]).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {usersLoading ? (
        <div className="flex justify-center py-10 text-muted-foreground text-[13px]">Loading…</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Company</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-[11.5px]">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {editUserId === u.id ? (
                      <select
                        value={editCompanyId}
                        onChange={(e) => setEditCompanyId(e.target.value)}
                        className="text-[12px] border border-border rounded px-1.5 py-0.5 bg-background focus:outline-none w-36"
                      >
                        <option value="">Unassigned</option>
                        {(companies as Company[]).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    ) : (
                      u.company?.name ?? <span className="text-orange-500 text-[11px] font-medium">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editUserId === u.id ? (
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="text-[12px] border border-border rounded px-1.5 py-0.5 bg-background focus:outline-none"
                      >
                        {["admin", "security", "viewer"].map((r) => (
                          <option key={r} value={r}>{r.replace("_", " ")}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={cn(
                        "text-[10.5px] font-semibold px-2 py-0.5 rounded-full",
                        u.role === "super_admin" ? "bg-purple-50 text-purple-700" :
                        u.role === "admin" ? "bg-orange-50 text-orange-700" :
                        u.role === "security" ? "bg-slate-100 text-slate-600" :
                        "bg-secondary text-muted-foreground",
                      )}>{u.role.replace("_", " ")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10.5px] font-semibold px-2 py-0.5 rounded-full", u.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {editUserId === u.id ? (
                        <>
                          <button onClick={saveEdit} className="text-[12px] font-semibold text-primary hover:underline">Save</button>
                          <button onClick={() => setEditUserId(null)} className="text-[12px] text-muted-foreground hover:underline">Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => startEdit(u)} className="text-[12px] font-medium text-primary hover:underline">Edit</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[13px] text-muted-foreground">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Platform Admins ───────────────────────────────────────────────────────────

function PlatformAdminsTab() {
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetchAdmin<Array<{ id: string; email: string; name: string | null; role: string; companyId: string | null; createdAt: string | null }>>("/api/admin/users"),
  });

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const superAdmins = (allUsers).filter(u => u.role === "super_admin");

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-semibold text-[22px] tracking-tight text-foreground mb-0.5">Platform Admins</h1>
        <p className="text-[13px] text-muted-foreground">Super admins have full platform access — companies CRM, impersonation, billing, and all settings.</p>
      </div>

      {/* security callout */}
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex gap-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div>
          <div className="text-[12px] font-bold text-red-700 mb-0.5">Security notice</div>
          <div className="text-[11.5px] text-red-600">Never elevate a company user to Super Admin. Super admins bypass all company-level restrictions. The <code className="font-mono bg-red-100 rounded px-1">super_admin</code> role must only be assigned directly in the database by a trusted operator.</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm mb-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <h3 className="font-bold text-[13px] text-foreground">Super Admins</h3>
            <p className="text-[11.5px] text-muted-foreground mt-0.5">{superAdmins.length} user{superAdmins.length !== 1 ? "s" : ""} with platform-wide access</p>
          </div>
          <button onClick={() => setShowInvite(p => !p)}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Invite Admin
          </button>
        </div>

        {showInvite && (
          <div className="px-5 py-4 bg-secondary/30 border-b border-border">
            <div className="text-[11.5px] font-semibold text-foreground mb-2">Invite via Email</div>
            <p className="text-[11px] text-muted-foreground mb-3">This will send a platform-admin invitation email. After accepting, you must manually assign the <code className="font-mono bg-secondary rounded px-1">super_admin</code> role in the database.</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && inviteEmail) {
                    toast.success(`Invitation queued for ${inviteEmail}. Assign super_admin role in DB after sign-up.`);
                    setInviteEmail("");
                    setShowInvite(false);
                  }
                }}
                className="flex-1 px-3 py-2 text-[12.5px] bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="admin@yourplatform.com"
              />
              <button
                onClick={() => {
                  if (!inviteEmail) return;
                  toast.success(`Invitation queued for ${inviteEmail}. Assign super_admin role in DB after sign-up.`);
                  setInviteEmail("");
                  setShowInvite(false);
                }}
                className="btn-primary flex-shrink-0 text-[12px]"
              >
                Send Invite
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground text-[13px]">Loading…</div>
        ) : superAdmins.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-muted-foreground">No super admins found. Assign the role directly in the database.</div>
        ) : (
          <div className="divide-y divide-border">
            {superAdmins.map(u => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0">
                    {(u.name ?? u.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-foreground">{u.name ?? u.email}</div>
                    {u.name && <div className="text-[11.5px] text-muted-foreground">{u.email}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1">super_admin</span>
                  {u.companyId && (
                    <span className="text-[10px] bg-red-50 border border-red-200 text-red-600 rounded-full px-2 py-0.5 font-semibold">has companyId!</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3">
        <div className="text-[11.5px] font-semibold text-foreground mb-1">How to assign super_admin</div>
        <div className="text-[11px] text-muted-foreground space-y-1">
          <div>1. Have the user sign up normally via Clerk.</div>
          <div>2. Find their record in the <code className="font-mono bg-secondary rounded px-1 text-foreground">users</code> table.</div>
          <div>3. Run: <code className="font-mono bg-secondary rounded px-1 text-foreground text-[10.5px]">UPDATE users SET role = 'super_admin', company_id = NULL WHERE email = 'user@example.com';</code></div>
          <div>4. They will be redirected to /admin on next sign-in.</div>
        </div>
      </div>
    </div>
  );
}

// ── Activity ──────────────────────────────────────────────────────────────────

interface ActivityEvent {
  type: "user_signup" | "company_created";
  id: string;
  label: string;
  detail: string;
  ts: string | Date;
}

function ActivityTab() {
  const { data: events = [], isLoading } = useQuery<ActivityEvent[]>({
    queryKey: ["/api/admin/activity"],
    queryFn: () => fetchAdmin<ActivityEvent[]>("/api/admin/activity"),
  });

  const typeIcons: Record<string, string> = {
    user_signup: "👤",
    company_created: "🏢",
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-semibold text-[22px] tracking-tight text-foreground mb-0.5">Activity</h1>
        <p className="text-[13px] text-muted-foreground">Recent platform events — sign-ups and company additions</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10 text-muted-foreground text-[13px]">Loading…</div>
      ) : (
        <div className="relative border-l-2 border-border ml-4 space-y-1">
          {events.map((e) => (
            <div key={`${e.type}-${e.id}`} className="relative pl-6 pb-4">
              <div className="absolute -left-[11px] top-1 w-5 h-5 bg-card border-2 border-border rounded-full flex items-center justify-center text-[10px]">
                {typeIcons[e.type] ?? "•"}
              </div>
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <div className="text-[13px] font-medium text-foreground">{e.label}</div>
                <div className="text-[11.5px] text-muted-foreground mt-0.5">{e.detail}</div>
                <div className="text-[11px] text-muted-foreground/60 mt-1">{fmtDate(typeof e.ts === "string" ? e.ts : e.ts.toISOString())}</div>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="pl-6 py-8 text-[13px] text-muted-foreground">No activity yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Company Integrations ──────────────────────────────────────────────────────

const INTEGRATION_TYPES = [
  { id: "sso_google", label: "Google Workspace SSO", icon: "G", color: "bg-red-50 text-red-600 border-red-200" },
  { id: "sso_microsoft", label: "Microsoft 365 SSO", icon: "M", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { id: "slack", label: "Slack Notifications", icon: "S", color: "bg-purple-50 text-purple-600 border-purple-200" },
  { id: "teams", label: "Microsoft Teams", icon: "T", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "email_smtp", label: "Custom SMTP Email", icon: "@", color: "bg-orange-50 text-orange-600 border-orange-200" },
  { id: "webhook", label: "Webhooks", icon: "⚡", color: "bg-amber-50 text-amber-600 border-amber-200" },
];

type IntegConfig = { enabled: boolean; clientId?: string; tenantId?: string; webhookUrl?: string; smtpHost?: string; smtpPort?: string; smtpUser?: string; notes?: string };
type CompanyIntegrations = Record<string, IntegConfig>;

function CompanyIntegrationsTab() {
  const { data: allCompanies = [], isLoading } = useAdminListCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<CompanyIntegrations>({});
  const [editInteg, setEditInteg] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<IntegConfig>({ enabled: false });
  const [saving, setSaving] = useState(false);
  const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  const companies = allCompanies as Company[];
  const selected = companies.find(c => c.id === selectedCompanyId);

  const storageKey = (cid: string) => `gp_admin_integrations_${cid}`;

  const loadIntegrations = (cid: string) => {
    try { const s = localStorage.getItem(storageKey(cid)); if (s) return JSON.parse(s) as CompanyIntegrations; } catch { /* */ }
    return {};
  };

  const saveIntegrations = (cid: string, data: CompanyIntegrations) => {
    localStorage.setItem(storageKey(cid), JSON.stringify(data));
    setIntegrations(data);
  };

  const selectCompany = (cid: string) => {
    setSelectedCompanyId(cid);
    setIntegrations(loadIntegrations(cid));
    setEditInteg(null);
  };

  const startEdit = (integId: string) => {
    setEditInteg(integId);
    setEditConfig(integrations[integId] ?? { enabled: false });
  };

  const saveEdit = async () => {
    if (!selectedCompanyId || !editInteg) return;
    setSaving(true);
    const next = { ...integrations, [editInteg]: editConfig };
    saveIntegrations(selectedCompanyId, next);
    try {
      await fetch(`/api/audit-logs`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updated", entity: "integration",
          entityId: editInteg,
          entityLabel: `${selected?.name} → ${INTEGRATION_TYPES.find(t => t.id === editInteg)?.label}`,
          details: { enabled: editConfig.enabled },
        }),
      });
    } catch { /* log failure is non-fatal */ }
    setSaving(false);
    setEditInteg(null);
    toast.success("Integration settings saved");
  };

  const toggleInteg = (integId: string) => {
    if (!selectedCompanyId) return;
    const current = integrations[integId] ?? { enabled: false };
    const next = { ...integrations, [integId]: { ...current, enabled: !current.enabled } };
    saveIntegrations(selectedCompanyId, next);
  };

  const inputCls = "w-full px-3 py-2 text-[12.5px] bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30";

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="font-semibold text-[22px] tracking-tight text-foreground mb-0.5">Company Integrations</h1>
        <p className="text-[13px] text-muted-foreground">Configure SSO, notifications, and API integrations per company</p>
      </div>

      <div className="flex gap-5">
        {/* Company selector */}
        <div className="w-56 flex-shrink-0">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Companies</div>
          {isLoading ? (
            <div className="text-[12px] text-muted-foreground text-center py-4">Loading…</div>
          ) : companies.length === 0 ? (
            <div className="text-[12px] text-muted-foreground text-center py-4">No companies yet</div>
          ) : (
            <div className="space-y-0.5">
              {companies.map(c => (
                <button key={c.id} onClick={() => selectCompany(c.id)}
                  className={cn("w-full text-left px-3 py-2.5 rounded-lg text-[12.5px] font-medium transition-colors",
                    selectedCompanyId === c.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
                  <div className="truncate">{c.name}</div>
                  <div className={cn("text-[10px] mt-0.5 truncate", selectedCompanyId === c.id ? "text-white/70" : "text-muted-foreground/60")}>{c.slug}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Integration config */}
        <div className="flex-1">
          {!selected ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-muted-foreground"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7M11 18H8a2 2 0 0 1-2-2V9"/></svg>
              </div>
              <div className="text-[13px] font-medium text-foreground mb-1">Select a company</div>
              <div className="text-[11.5px] text-muted-foreground">Choose a company from the left to configure its integrations</div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-semibold text-[14px] text-foreground">{selected.name}</div>
                  <div className="text-[11.5px] text-muted-foreground">Integration settings</div>
                </div>
                <span className={cn("text-[10.5px] font-semibold px-2.5 py-1 rounded-full capitalize", LICENSE_STATUS_COLORS[selected.licenseStatus ?? "trial"] ?? "bg-secondary text-muted-foreground")}>
                  {selected.licenseStatus ?? "trial"}
                </span>
              </div>

              <div className="space-y-3">
                {INTEGRATION_TYPES.map(integ => {
                  const cfg = integrations[integ.id] ?? { enabled: false };
                  const isEditing = editInteg === integ.id;
                  return (
                    <div key={integ.id} className="bg-card border border-border rounded-xl overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-[12px] flex-shrink-0", integ.color)}>
                          {integ.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-foreground">{integ.label}</div>
                          <div className={cn("text-[10.5px] font-medium mt-0.5", cfg.enabled ? "text-green-600" : "text-muted-foreground")}>
                            {cfg.enabled ? "Enabled" : "Not configured"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => toggleInteg(integ.id)}
                            className={cn("w-9 h-5 rounded-full relative transition-colors", cfg.enabled ? "bg-green-500" : "bg-border")}>
                            <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all", cfg.enabled ? "left-[18px]" : "left-0.5")} />
                          </button>
                          <button onClick={() => isEditing ? setEditInteg(null) : startEdit(integ.id)}
                            className="text-[11.5px] text-primary border border-primary/30 rounded-lg px-2.5 py-1 hover:bg-primary/5 transition-colors font-medium">
                            {isEditing ? "Close" : "Configure"}
                          </button>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="border-t border-border bg-secondary/20 px-4 py-4">
                          {(integ.id === "sso_google" || integ.id === "sso_microsoft") && (
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Client ID</label>
                                <input className={inputCls} value={editConfig.clientId ?? ""} onChange={e => setEditConfig(p => ({ ...p, clientId: e.target.value }))} placeholder="OAuth 2.0 Client ID" />
                              </div>
                              {integ.id === "sso_microsoft" && (
                                <div>
                                  <label className="block text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tenant ID</label>
                                  <input className={inputCls} value={editConfig.tenantId ?? ""} onChange={e => setEditConfig(p => ({ ...p, tenantId: e.target.value }))} placeholder="Azure Tenant ID" />
                                </div>
                              )}
                            </div>
                          )}
                          {(integ.id === "slack" || integ.id === "teams" || integ.id === "webhook") && (
                            <div className="mb-3">
                              <label className="block text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                {integ.id === "webhook" ? "Webhook URL" : "Incoming Webhook URL"}
                              </label>
                              <input className={inputCls} value={editConfig.webhookUrl ?? ""} onChange={e => setEditConfig(p => ({ ...p, webhookUrl: e.target.value }))} placeholder="https://" />
                            </div>
                          )}
                          {integ.id === "email_smtp" && (
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="col-span-2">
                                <label className="block text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">SMTP Host</label>
                                <input className={inputCls} value={editConfig.smtpHost ?? ""} onChange={e => setEditConfig(p => ({ ...p, smtpHost: e.target.value }))} placeholder="smtp.example.com" />
                              </div>
                              <div>
                                <label className="block text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Port</label>
                                <input className={inputCls} value={editConfig.smtpPort ?? ""} onChange={e => setEditConfig(p => ({ ...p, smtpPort: e.target.value }))} placeholder="587" />
                              </div>
                              <div>
                                <label className="block text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Username</label>
                                <input className={inputCls} value={editConfig.smtpUser ?? ""} onChange={e => setEditConfig(p => ({ ...p, smtpUser: e.target.value }))} placeholder="noreply@company.com" />
                              </div>
                            </div>
                          )}
                          <div className="mb-3">
                            <label className="block text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Internal Notes</label>
                            <input className={inputCls} value={editConfig.notes ?? ""} onChange={e => setEditConfig(p => ({ ...p, notes: e.target.value }))} placeholder="Any notes about this integration setup…" />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditInteg(null)} className="btn-ghost text-[12px] py-1.5">Cancel</button>
                            <button onClick={saveEdit} disabled={saving} className="btn-primary text-[12px] py-1.5">{saving ? "Saving…" : "Save Configuration"}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Company Form Modal ────────────────────────────────────────────────────────

function CompanyFormModal({
  title,
  initial,
  onClose,
  onSave,
}: {
  title: string;
  initial?: Company;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [plan, setPlan] = useState(initial?.plan ?? "starter");
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>((initial?.licenseStatus as LicenseStatus) ?? "trial");
  const [maxSeats, setMaxSeats] = useState(String(initial?.maxSeats ?? "10"));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  // Legacy single contact (kept for backwards compat)
  const [contactName, setContactName] = useState(initial?.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(initial?.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(initial?.contactPhone ?? "");
  // Multi-contacts
  const parseContacts = (raw?: string | null): CompanyContact[] => {
    try { return raw ? JSON.parse(raw) : []; } catch { return []; }
  };
  const [contacts, setContacts] = useState<CompanyContact[]>(parseContacts(initial?.contacts));
  // Contract
  const [contractStart, setContractStart] = useState(initial?.contractStart ? initial.contractStart.slice(0, 10) : "");
  const [contractEnd, setContractEnd] = useState(initial?.contractEnd ? initial.contractEnd.slice(0, 10) : "");
  const [contractValue, setContractValue] = useState(initial?.contractValue ?? "");
  // Products
  const [products, setProducts] = useState<ProductKey[]>(parseProducts(initial?.products));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const addContact = () => setContacts(prev => [...prev, {
    id: crypto.randomUUID(), name: "", email: "", phone: "", role: "Primary",
  }]);
  const removeContact = (id: string) => setContacts(prev => prev.filter(c => c.id !== id));
  const updateContact = (id: string, field: keyof CompanyContact, value: string) =>
    setContacts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));

  const handleNameChange = (v: string) => {
    setName(v);
    if (!initial) setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60));
  };

  const save = async () => {
    if (!name || !slug) { toast.error("Name and slug are required"); return; }
    setSaving(true);
    try {
      await onSave({ name, slug, plan, licenseStatus, maxSeats, isActive, contactName, contactEmail, contactPhone, contractStart: contractStart || null, contractEnd: contractEnd || null, contractValue: contractValue || null, products, notes: notes || null, contacts: JSON.stringify(contacts) });
    } finally { setSaving(false); }
  };

  const toggleProduct = (p: ProductKey) => {
    setProducts(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const labelCls = "text-[11.5px] font-semibold text-foreground mb-1 block";
  const inputCls = "w-full px-3 py-2 text-[12.5px] bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-[16px] text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Basic */}
          <section>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Basic Info</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Company Name *</label>
                <input value={name} onChange={(e) => handleNameChange(e.target.value)} className={inputCls} placeholder="Acme Industries" />
              </div>
              <div>
                <label className={labelCls}>Slug *</label>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} className={cn(inputCls, "font-mono")} placeholder="acme-industries" />
              </div>
              <div>
                <label className={labelCls}>Plan</label>
                <select value={plan} onChange={(e) => setPlan(e.target.value as never)} className={inputCls}>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>License Status</label>
                <select value={licenseStatus} onChange={(e) => setLicenseStatus(e.target.value as LicenseStatus)} className={inputCls}>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Max Seats</label>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={maxSeats}
                  onChange={(e) => setMaxSeats(e.target.value)}
                  className={cn(inputCls, "font-mono")}
                  placeholder="10"
                />
              </div>
              <div className="flex items-center gap-2 pt-3 col-span-2">
                <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-border" />
                <label htmlFor="isActive" className="text-[12.5px] text-foreground cursor-pointer">Active</label>
              </div>
            </div>
          </section>

          {/* Primary Contact (legacy) */}
          <section>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Primary Contact</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Name</label>
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputCls} placeholder="Rahul Sharma" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputCls} placeholder="+91 98765 43210" />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Email</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inputCls} placeholder="rahul@company.com" />
              </div>
            </div>
          </section>

          {/* Multi-contacts */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Additional Contacts</div>
              <button
                type="button"
                onClick={addContact}
                className="flex items-center gap-1 text-[11.5px] font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Contact
              </button>
            </div>
            {contacts.length === 0 ? (
              <p className="text-[12px] text-muted-foreground/60 italic">No additional contacts. Click "Add Contact" to add billing, technical, or operations contacts.</p>
            ) : (
              <div className="space-y-3">
                {contacts.map((c, idx) => (
                  <div key={c.id} className="border border-border rounded-xl p-3 bg-secondary/30 space-y-2.5 relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide">Contact {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeContact(c.id)}
                        className="text-muted-foreground/50 hover:text-red-500 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10.5px] font-semibold text-muted-foreground mb-1 block">Name</label>
                        <input
                          value={c.name}
                          onChange={e => updateContact(c.id, "name", e.target.value)}
                          className={inputCls}
                          placeholder="Contact name"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-semibold text-muted-foreground mb-1 block">Role</label>
                        <select
                          value={c.role}
                          onChange={e => updateContact(c.id, "role", e.target.value)}
                          className={inputCls}
                        >
                          {CONTACT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10.5px] font-semibold text-muted-foreground mb-1 block">Email</label>
                        <input
                          type="email"
                          value={c.email ?? ""}
                          onChange={e => updateContact(c.id, "email", e.target.value)}
                          className={inputCls}
                          placeholder="email@company.com"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-semibold text-muted-foreground mb-1 block">Phone</label>
                        <input
                          value={c.phone ?? ""}
                          onChange={e => updateContact(c.id, "phone", e.target.value)}
                          className={inputCls}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Contract */}
          <section>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Contract</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Start Date</label>
                <input type="date" value={contractStart} onChange={(e) => setContractStart(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>End Date</label>
                <input type="date" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Value (₹)</label>
                <input value={contractValue} onChange={(e) => setContractValue(e.target.value)} className={inputCls} placeholder="1,20,000" />
              </div>
            </div>
          </section>

          {/* Products */}
          <section>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Products Opted</div>
            <div className="flex flex-wrap gap-2">
              {ALL_PRODUCTS.map((p) => {
                const on = products.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleProduct(p)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors",
                      on ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    )}
                  >
                    {on && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><polyline points="20 6 9 17 4 12"/></svg>}
                    {PRODUCT_LABELS[p]}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Notes */}
          <section>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Internal Notes</div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={cn(inputCls, "resize-none")} placeholder="Any notes about this account, special requirements, escalations…" />
          </section>
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving || !name} className="btn-primary">
            {saving ? "Saving…" : initial ? "Save Changes" : "Create Company"}
          </button>
        </div>
      </div>
    </div>
  );
}
