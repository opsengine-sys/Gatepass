import { useState } from "react";
import { useClerk } from "@clerk/react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { UserProfile } from "@/types";

interface Props {
  user: UserProfile | null;
}

export function OnboardingPage({ user }: Props) {
  const { signOut } = useClerk();
  const qc = useQueryClient();
  const [companyName, setCompanyName] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [officeCity, setOfficeCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async () => {
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          companyName: companyName.trim(),
          officeName: officeName.trim() || undefined,
          officeCity: officeCity.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create company");
      }
      toast.success("Company created! Welcome to GatePass.");
      // Invalidate /api/me so AppContext reloads the user with companyId
      await qc.invalidateQueries({ queryKey: ["/api/me"] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
            <rect x="3" y="4" width="14" height="10" rx="2"/>
            <path d="M7 8h6M7 11h4"/>
            <rect x="7" y="17" width="10" height="3" rx="1.5"/>
          </svg>
        </div>
        <div>
          <div className="font-serif font-semibold text-[16px] text-foreground">GatePass</div>
          <div className="text-[10.5px] text-muted-foreground leading-none">Visitor & Pass Management</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-sm">
        {!showForm ? (
          <>
            <div className="w-14 h-14 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg viewBox="0 0 24 24" fill="none" stroke="#c06b2c" strokeWidth="2" className="w-7 h-7">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>

            <h2 className="font-serif text-xl font-semibold text-foreground mb-2 text-center">
              Welcome{user?.name && user.name !== "New User" && user.name !== "User" ? `, ${user.name.split(" ")[0]}` : ""}!
            </h2>
            <p className="text-[13.5px] text-muted-foreground mb-6 leading-relaxed text-center">
              Your account is ready. Set up your company to start managing visitors, or wait for an admin to invite you.
            </p>

            <button
              onClick={() => setShowForm(true)}
              className="btn-primary w-full justify-center mb-3"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
              Set Up My Company
            </button>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-5">
              <p className="text-[12px] font-semibold text-amber-800 mb-1">Already have a company?</p>
              <p className="text-[12px] text-amber-700 leading-relaxed">
                Ask your company's GatePass admin to assign you. Share your email:
              </p>
              <p className="text-[12.5px] text-foreground font-mono mt-1.5 break-all">{user?.email}</p>
            </div>

            <button
              onClick={() => signOut()}
              className="btn-ghost w-full justify-center text-[13px]"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowForm(false)}
              className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground mb-5 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Back
            </button>

            <h2 className="font-serif text-lg font-semibold text-foreground mb-1">Set Up Your Company</h2>
            <p className="text-[12.5px] text-muted-foreground mb-5">You'll become the admin for this company.</p>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-foreground mb-1.5 block">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  placeholder="e.g. Acme Industries"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-foreground mb-1.5 block">
                  First Office Name
                  <span className="text-[11px] font-normal text-muted-foreground ml-1">(optional)</span>
                </label>
                <input
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  placeholder="e.g. Mumbai HQ"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-foreground mb-1.5 block">
                  City
                  <span className="text-[11px] font-normal text-muted-foreground ml-1">(optional)</span>
                </label>
                <input
                  value={officeCity}
                  onChange={(e) => setOfficeCity(e.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  placeholder="e.g. Mumbai"
                />
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={saving || !companyName.trim()}
              className="btn-primary w-full justify-center mt-6"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Create Company & Continue
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
