import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import type { Company, UserProfile } from "@/types";

type Tab = "companies" | "users";

export function AdminPanel({ superAdminNoCompany = false }: { superAdminNoCompany?: boolean }) {
  const qc = useQueryClient();
  const { signOut } = useClerk();
  const [tab, setTab] = useState<Tab>("companies");
  const [companyFilter, setCompanyFilter] = useState("");

  const { data: companies = [], isLoading: companiesLoading } = useAdminListCompanies();
  const { data: users = [], isLoading: usersLoading } = useAdminListUsers(
    {},
    { query: { enabled: tab === "users" } } as never,
  );

  const [newCompanyOpen, setNewCompanyOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);

  const panel = (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-[21px] font-medium text-foreground">Super Admin Panel</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">Manage all companies and users</p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "companies" && (
            <button onClick={() => setNewCompanyOpen(true)} className="btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Company
            </button>
          )}
          {superAdminNoCompany && (
            <button onClick={() => signOut()} className="btn-ghost text-[12.5px]">Sign out</button>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-5 border-b border-border">
        {(["companies", "users"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors capitalize",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "companies" && (
        <CompaniesTab
          companies={companies as Company[]}
          loading={companiesLoading}
          filter={companyFilter}
          onFilter={setCompanyFilter}
          onEdit={setEditCompany}
          onDelete={async (id) => {
            await adminDeleteCompany(id);
            qc.invalidateQueries({ queryKey: ["/api/admin/companies"] });
            toast.success("Company deactivated");
          }}
          onRefresh={() => qc.invalidateQueries({ queryKey: ["/api/admin/companies"] })}
        />
      )}

      {tab === "users" && (
        <UsersTab
          users={users as UserProfile[]}
          companies={companies as Company[]}
          loading={usersLoading}
          onSave={async (userId, updates) => {
            await adminUpdateUser(userId, updates);
            qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast.success("User updated");
          }}
        />
      )}

      {newCompanyOpen && (
        <NewCompanyModal
          onClose={() => setNewCompanyOpen(false)}
          onSave={async (data) => {
            await adminCreateCompany(data as never);
            qc.invalidateQueries({ queryKey: ["/api/admin/companies"] });
            toast.success("Company created");
            setNewCompanyOpen(false);
          }}
        />
      )}

      {editCompany && (
        <EditCompanyModal
          company={editCompany}
          onClose={() => setEditCompany(null)}
          onSave={async (data) => {
            await adminUpdateCompany(editCompany.id, data);
            qc.invalidateQueries({ queryKey: ["/api/admin/companies"] });
            toast.success("Company updated");
            setEditCompany(null);
          }}
        />
      )}
    </div>
  );

  if (superAdminNoCompany) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card px-6 py-3 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-3.5 h-3.5">
              <rect x="3" y="4" width="14" height="10" rx="2"/>
              <path d="M7 8h6M7 11h4"/>
              <rect x="7" y="17" width="10" height="3" rx="1.5"/>
            </svg>
          </div>
          <span className="font-serif font-semibold text-[15px] text-foreground">GatePass</span>
          <span className="ml-2 text-[11px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Super Admin</span>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-8">{panel}</div>
      </div>
    );
  }

  return panel;
}

function CompaniesTab({
  companies, loading, filter, onFilter, onEdit, onDelete, onRefresh,
}: {
  companies: Company[];
  loading: boolean;
  filter: string;
  onFilter: (v: string) => void;
  onEdit: (c: Company) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}) {
  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.slug.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={filter}
            onChange={(e) => onFilter(e.target.value)}
            placeholder="Search companies…"
            className="w-full pl-8 pr-3 py-2 text-[13px] bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-muted-foreground text-[13px]">Loading…</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Company</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Slug</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Users</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground text-[12px]">{c.slug}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                      c.plan === "enterprise" ? "bg-purple-50 text-purple-700" :
                      c.plan === "growth" ? "bg-blue-50 text-blue-700" :
                      "bg-orange-50 text-orange-700"
                    )}>{c.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{(c as any).userCount ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                      c.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}>{c.isActive ? "Active" : "Inactive"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => onEdit(c)} className="text-[12px] font-medium text-primary hover:underline">Edit</button>
                      <button onClick={() => onDelete(c.id)} className="text-[12px] font-medium text-red-600 hover:underline">Deactivate</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-10 text-center text-[13px] text-muted-foreground">No companies found</div>
          )}
        </div>
      )}
    </div>
  );
}

function UsersTab({
  users, companies, loading, onSave,
}: {
  users: UserProfile[];
  companies: Company[];
  loading: boolean;
  onSave: (userId: string, updates: Record<string, unknown>) => Promise<void>;
}) {
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editCompanyId, setEditCompanyId] = useState("");

  const startEdit = (u: UserProfile) => {
    setEditUserId(u.id);
    setEditRole(u.role);
    setEditCompanyId(u.companyId ?? "");
  };

  const saveEdit = async () => {
    if (!editUserId) return;
    await onSave(editUserId, { role: editRole, companyId: editCompanyId || null });
    setEditUserId(null);
  };

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-10 text-muted-foreground text-[13px]">Loading…</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
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
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-[12px]">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.company?.name ?? <span className="text-red-500 text-[11.5px]">Unassigned</span>}</td>
                  <td className="px-4 py-3">
                    {editUserId === u.id ? (
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="text-[12px] bg-background border border-border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      >
                        {["super_admin", "admin", "security", "viewer"].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                        u.role === "super_admin" ? "bg-purple-50 text-purple-700" :
                        u.role === "admin" ? "bg-orange-50 text-orange-700" :
                        u.role === "security" ? "bg-teal-50 text-teal-700" :
                        "bg-secondary text-muted-foreground"
                      )}>{u.role.replace("_", " ")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                      u.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}>{u.isActive ? "Active" : "Inactive"}</span>
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
          {users.length === 0 && (
            <div className="py-10 text-center text-[13px] text-muted-foreground">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}

function NewCompanyModal({ onClose, onSave }: { onClose: () => void; onSave: (data: { name: string; slug: string; plan: string }) => Promise<void> }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("starter");
  const [saving, setSaving] = useState(false);

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  const save = async () => {
    if (!name || !slug) return;
    setSaving(true);
    try { await onSave({ name, slug, plan }); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-serif font-semibold text-[16px] text-foreground mb-4">New Company</h3>
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-foreground mb-1 block">Company Name</label>
            <input value={name} onChange={(e) => handleNameChange(e.target.value)} className="w-full px-3 py-2 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="Acme Corp" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-foreground mb-1 block">Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full px-3 py-2 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 font-mono" placeholder="acme-corp" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-foreground mb-1 block">Plan</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full px-3 py-2 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30">
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
          <button onClick={save} disabled={saving || !name} className="btn-primary flex-1 justify-center">{saving ? "Saving…" : "Create"}</button>
        </div>
      </div>
    </div>
  );
}

function EditCompanyModal({ company, onClose, onSave }: { company: Company; onClose: () => void; onSave: (data: Record<string, unknown>) => Promise<void> }) {
  const [name, setName] = useState(company.name);
  const [plan, setPlan] = useState(company.plan);
  const [isActive, setIsActive] = useState(company.isActive);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try { await onSave({ name, plan, isActive }); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-serif font-semibold text-[16px] text-foreground mb-4">Edit Company</h3>
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-foreground mb-1 block">Company Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-foreground mb-1 block">Plan</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value as Company["plan"])} className="w-full px-3 py-2 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30">
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-border" />
            <span className="text-[13px] text-foreground">Active</span>
          </label>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1 justify-center">{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
