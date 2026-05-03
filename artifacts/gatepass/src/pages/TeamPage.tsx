import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListUsers,
  useListOffices,
  updateUser,
  deleteUser,
  getListUsersQueryKey,
  UpdateUserInputRole,
} from "@workspace/api-client-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import type { UserProfile, Office } from "@/types";

function qo(opts: Record<string, unknown>) {
  return { query: opts } as never;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  security: "Security",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-50 text-purple-700",
  admin: "bg-orange-50 text-orange-700",
  security: "bg-blue-50 text-blue-700",
  viewer: "bg-slate-100 text-slate-600",
};

interface EditUserModalProps {
  member: UserProfile;
  offices: Office[];
  onSave: (role: UpdateUserInputRole, officeId: string) => Promise<void>;
  onClose: () => void;
}

function EditUserModal({ member, offices, onSave, onClose }: EditUserModalProps) {
  const [role, setRole] = useState<UpdateUserInputRole>(
    member.role === "super_admin" ? "admin" : (member.role as UpdateUserInputRole),
  );
  const [officeId, setOfficeId] = useState(member.officeId ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(role, officeId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-[420px] p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-[15px] text-foreground">Edit Team Member</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">{member.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              Role
            </label>
            <select
              className="input-field w-full"
              value={role}
              onChange={(e) => setRole(e.target.value as UpdateUserInputRole)}
            >
              <option value="admin">Admin</option>
              <option value="security">Security</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              Default Office
            </label>
            <select
              className="input-field w-full"
              value={officeId}
              onChange={(e) => setOfficeId(e.target.value)}
            >
              <option value="">— None —</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>{o.name} — {o.city}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ConfirmDeactivateProps {
  member: UserProfile;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

function ConfirmDeactivate({ member, onConfirm, onClose }: ConfirmDeactivateProps) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-[380px] p-6">
        <h2 className="font-bold text-[15px] text-foreground mb-2">Remove Team Member?</h2>
        <p className="text-[13px] text-muted-foreground mb-5">
          <span className="font-semibold text-foreground">{member.name}</span> will be deactivated and
          lose access to GatePass. Their historical data will be preserved.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={async () => { setLoading(true); await onConfirm(); }}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const colors = [
    "bg-orange-100 text-orange-700",
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-teal-100 text-teal-700",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] flex-shrink-0 ${color}`}>
      {initials || "?"}
    </div>
  );
}

export function TeamPage() {
  const qc = useQueryClient();
  const { user } = useApp();

  const { data: rawMembers = [], isLoading } = useListUsers(
    qo({ refetchOnWindowFocus: true }),
  );
  const members = rawMembers as UserProfile[];

  const { data: rawOffices = [] } = useListOffices(qo({}));
  const offices = rawOffices as Office[];

  const [editMember, setEditMember] = useState<UserProfile | null>(null);
  const [deactivateMember, setDeactivateMember] = useState<UserProfile | null>(null);
  const [search, setSearch] = useState("");

  const canManage = user?.role === "admin" || user?.role === "super_admin";

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
  };

  const handleEdit = async (role: UpdateUserInputRole, officeId: string) => {
    if (!editMember) return;
    await updateUser(editMember.id, {
      role,
      officeId: officeId || undefined,
    });
    invalidate();
    toast.success("Member updated");
    setEditMember(null);
  };

  const handleDeactivate = async () => {
    if (!deactivateMember) return;
    await deleteUser(deactivateMember.id);
    invalidate();
    toast.success("Member removed");
    setDeactivateMember(null);
  };

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  const active = filtered.filter((m) => m.isActive !== false);
  const inactive = filtered.filter((m) => m.isActive === false);

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-semibold text-[21px] tracking-tight text-foreground">Team</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">
            {members.filter((m) => m.isActive !== false).length} active member
            {members.filter((m) => m.isActive !== false).length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="input-field pl-8 w-[200px]"
            placeholder="Search members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center shadow-sm">
          <p className="font-semibold text-[14px] text-foreground mb-1">No team members yet</p>
          <p className="text-[12.5px] text-muted-foreground">
            Team members appear here once they sign up and are linked to your company.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 border-b border-border">
              <h2 className="font-bold text-[13px] text-foreground">
                Active Members
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">({active.length})</span>
              </h2>
            </div>
            {active.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-muted-foreground">No active members match your search</div>
            ) : (
              <div className="divide-y divide-border">
                {active.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    offices={offices}
                    isSelf={member.id === user?.id}
                    canManage={canManage && member.role !== "super_admin"}
                    onEdit={() => setEditMember(member)}
                    onDeactivate={() => setDeactivateMember(member)}
                  />
                ))}
              </div>
            )}
          </div>

          {inactive.length > 0 && (
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden opacity-60">
              <div className="px-5 pt-4 pb-2 border-b border-border">
                <h2 className="font-bold text-[13px] text-foreground">
                  Deactivated
                  <span className="ml-2 text-[11px] font-normal text-muted-foreground">({inactive.length})</span>
                </h2>
              </div>
              <div className="divide-y divide-border">
                {inactive.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    offices={offices}
                    isSelf={false}
                    canManage={false}
                    onEdit={() => {}}
                    onDeactivate={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {editMember && (
        <EditUserModal
          member={editMember}
          offices={offices}
          onSave={handleEdit}
          onClose={() => setEditMember(null)}
        />
      )}

      {deactivateMember && (
        <ConfirmDeactivate
          member={deactivateMember}
          onConfirm={handleDeactivate}
          onClose={() => setDeactivateMember(null)}
        />
      )}
    </div>
  );
}

interface MemberRowProps {
  member: UserProfile;
  offices: Office[];
  isSelf: boolean;
  canManage: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
}

function MemberRow({ member, offices, isSelf, canManage, onEdit, onDeactivate }: MemberRowProps) {
  const office = offices.find((o) => o.id === member.officeId);
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <Avatar name={member.name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[13px] text-foreground truncate">{member.name}</span>
          {isSelf && (
            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
              You
            </span>
          )}
          <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full ${ROLE_COLORS[member.role] ?? "bg-slate-100 text-slate-600"}`}>
            {ROLE_LABELS[member.role] ?? member.role}
          </span>
        </div>
        <div className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{member.email}</div>
        {office && (
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {office.name} — {office.city}
          </div>
        )}
      </div>
      {canManage && (
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="px-2.5 py-1.5 text-[11.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDeactivate}
            className="px-2.5 py-1.5 text-[11.5px] font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
