import { useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "./Sidebar";
import { useBranding } from "@/contexts/BrandingContext";
import type { Visitor, GatePass, UserProfile } from "@/types";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  office: string;
  officeFull: string;
  visitors: Visitor[];
  gatePasses: GatePass[];
  user: UserProfile;
  onOpenOfficePicker: () => void;
}

const titleMap: Record<string, { title: string; module: "visitors" | "gatepasses" | "admin" | "settings" }> = {
  "/": { title: "VM Dashboard", module: "visitors" },
  "/visitors": { title: "Visitors", module: "visitors" },
  "/activity-log": { title: "Activity Log", module: "visitors" },
  "/visitor-link": { title: "Visitor Link", module: "visitors" },
  "/gp-dashboard": { title: "GP Dashboard", module: "gatepasses" },
  "/gate-passes": { title: "Gate Passes", module: "gatepasses" },
  "/gp-activity-log": { title: "GP Activity Log", module: "gatepasses" },
  "/admin": { title: "Admin Panel", module: "admin" },
  "/settings": { title: "Settings", module: "settings" },
};

export function AppLayout({ children, office, officeFull, visitors, gatePasses, user, onOpenOfficePicker }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { logoUrl, companyName } = useBranding();

  const meta = titleMap[location] ?? { title: "GatePass", module: "visitors" as const };
  const checkedIn = visitors.filter(v => v.status === "Checked In").length;
  const openGP = gatePasses.filter(g => g.status === "Open").length;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        officeFull={officeFull}
        visitors={visitors}
        gatePasses={gatePasses}
        user={user}
        onOpenOfficePicker={onOpenOfficePicker}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[52px] border-b border-border flex items-center px-5 gap-3 bg-card flex-shrink-0">
          <button
            className="md:hidden flex items-center justify-center bg-secondary border border-border rounded-lg p-1.5 text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
            meta.module === "gatepasses" ? "bg-teal-50 text-teal-700" :
            meta.module === "admin" ? "bg-purple-50 text-purple-700" :
            meta.module === "settings" ? "bg-slate-100 text-slate-600" :
            "bg-orange-50 text-orange-700"
          )}>
            {meta.module === "gatepasses" ? "Gate Passes" : meta.module === "admin" ? "Admin" : meta.module === "settings" ? "Account" : "Visitors"}
          </span>

          <div className="font-bold text-sm flex-1 text-foreground flex items-center gap-2">
            {logoUrl && (
              <img src={logoUrl} alt={companyName} className="h-5 w-auto object-contain opacity-70" />
            )}
            {meta.title}
          </div>

          <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground bg-secondary border border-border rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {checkedIn} inside · {openGP} open passes
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
