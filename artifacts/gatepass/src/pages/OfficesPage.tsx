import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOffices,
  createOffice,
  updateOffice,
  deleteOffice,
  getListOfficesQueryKey,
} from "@workspace/api-client-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import type { Office } from "@/types";

function qo(opts: Record<string, unknown>) {
  return { query: opts } as never;
}

interface OfficeFormData {
  name: string;
  city: string;
  address: string;
}

const EMPTY_FORM: OfficeFormData = { name: "", city: "", address: "" };

interface OfficeModalProps {
  initial?: OfficeFormData;
  title: string;
  onSave: (data: OfficeFormData) => Promise<void>;
  onClose: () => void;
}

function OfficeModal({ initial = EMPTY_FORM, title, onSave, onClose }: OfficeModalProps) {
  const [form, setForm] = useState<OfficeFormData>(initial);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof OfficeFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim()) {
      toast.error("Name and city are required");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-[420px] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[15px] text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              Office Name <span className="text-red-500">*</span>
            </label>
            <input
              className="input-field w-full"
              placeholder="e.g. HQ, North Branch"
              value={form.name}
              onChange={set("name")}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              City <span className="text-red-500">*</span>
            </label>
            <input
              className="input-field w-full"
              placeholder="e.g. Hyderabad"
              value={form.city}
              onChange={set("city")}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              Address
            </label>
            <input
              className="input-field w-full"
              placeholder="Street address (optional)"
              value={form.address}
              onChange={set("address")}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving…" : "Save Office"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ConfirmDeactivateProps {
  office: Office;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

function ConfirmDeactivate({ office, onConfirm, onClose }: ConfirmDeactivateProps) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-[380px] p-6">
        <h2 className="font-bold text-[15px] text-foreground mb-2">Deactivate Office?</h2>
        <p className="text-[13px] text-muted-foreground mb-5">
          <span className="font-semibold text-foreground">{office.name} — {office.city}</span> will be
          hidden and no new visitors or gate passes can be created for it. This cannot be undone from the UI.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={async () => { setLoading(true); await onConfirm(); }}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? "Deactivating…" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OfficesPage() {
  const qc = useQueryClient();
  const { user, offices: ctxOffices, setSelectedOffice } = useApp();

  const { data: rawOffices = [], isLoading } = useListOffices(
    qo({ refetchOnWindowFocus: true }),
  );
  const offices = rawOffices as Office[];

  const [addOpen, setAddOpen] = useState(false);
  const [editOffice, setEditOffice] = useState<Office | null>(null);
  const [deactivateOffice, setDeactivateOffice] = useState<Office | null>(null);

  const canManage = user?.role === "admin" || user?.role === "super_admin";

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListOfficesQueryKey() });
  };

  const handleAdd = async (form: OfficeFormData) => {
    await createOffice({
      name: form.name,
      city: form.city,
      address: form.address || undefined,
    });
    invalidate();
    toast.success("Office created");
    setAddOpen(false);
  };

  const handleEdit = async (form: OfficeFormData) => {
    if (!editOffice) return;
    await updateOffice(editOffice.id, {
      name: form.name,
      city: form.city,
      address: form.address || undefined,
    });
    invalidate();
    toast.success("Office updated");
    setEditOffice(null);
  };

  const handleDeactivate = async (office: Office) => {
    await deleteOffice(office.id);
    invalidate();
    const remaining = ctxOffices.filter((o) => o.id !== office.id);
    if (remaining.length > 0) setSelectedOffice(remaining[0]);
    toast.success("Office deactivated");
    setDeactivateOffice(null);
  };

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-semibold text-[21px] tracking-tight text-foreground">Offices</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">
            Manage your organization's office locations
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 bg-primary text-white px-3.5 py-2 rounded-lg text-[12.5px] font-semibold hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3.5 h-3.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Office
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : offices.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center shadow-sm">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <BuildingIcon />
          </div>
          <p className="font-semibold text-[14px] text-foreground mb-1">No offices yet</p>
          <p className="text-[12.5px] text-muted-foreground">Add your first office location to get started.</p>
          {canManage && (
            <button onClick={() => setAddOpen(true)} className="btn-primary mt-4">
              Add First Office
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {offices.map((office) => (
            <div
              key={office.id}
              className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <BuildingIcon className="text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-[14px] text-foreground">{office.name}</div>
                    <div className="text-[12px] text-muted-foreground">{office.city}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 flex-shrink-0">
                  Active
                </span>
              </div>

              {office.address && (
                <div className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{office.address}</span>
                </div>
              )}

              <div className="text-[10.5px] text-muted-foreground">
                Added {new Date(office.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
              </div>

              {canManage && (
                <div className="flex gap-2 pt-1 border-t border-border mt-auto">
                  <button
                    onClick={() => setEditOffice(office)}
                    className="flex-1 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg py-1.5 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeactivateOffice(office)}
                    className="flex-1 text-[12px] font-medium text-red-500 hover:bg-red-50 rounded-lg py-1.5 transition-colors"
                  >
                    Deactivate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <OfficeModal
          title="Add Office"
          onSave={handleAdd}
          onClose={() => setAddOpen(false)}
        />
      )}

      {editOffice && (
        <OfficeModal
          title="Edit Office"
          initial={{ name: editOffice.name, city: editOffice.city, address: editOffice.address ?? "" }}
          onSave={handleEdit}
          onClose={() => setEditOffice(null)}
        />
      )}

      {deactivateOffice && (
        <ConfirmDeactivate
          office={deactivateOffice}
          onConfirm={() => handleDeactivate(deactivateOffice)}
          onClose={() => setDeactivateOffice(null)}
        />
      )}
    </div>
  );
}

function BuildingIcon({ className = "text-primary" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`w-4.5 h-4.5 ${className}`}>
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M9 22V12h6v10"/>
      <path d="M9 7h1m4 0h1M9 12h1m4 0h1"/>
    </svg>
  );
}
