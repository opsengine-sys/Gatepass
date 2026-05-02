import { useLocation, Link } from "wouter";
import { useClerk } from "@clerk/react";
import { cn } from "@/lib/utils";
import type { Visitor, GatePass, UserProfile } from "@/types";

interface SidebarProps {
  officeFull: string;
  visitors: Visitor[];
  gatePasses: GatePass[];
  user: UserProfile;
  onOpenOfficePicker: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { section: "Visitor Management" },
  { id: "dashboard", label: "VM Dashboard", path: "/", mod: "visitors" },
  { id: "visitors", label: "Visitors", path: "/visitors", mod: "visitors", badge: true },
  { id: "logs", label: "Activity Log", path: "/activity-log", mod: "visitors" },
  { id: "visitor-link", label: "Visitor Link", path: "/visitor-link", mod: "visitors" },
  { section: "Gate Passes" },
  { id: "gpdashboard", label: "GP Dashboard", path: "/gp-dashboard", mod: "gatepasses" },
  { id: "gatepasses", label: "Gate Passes", path: "/gate-passes", mod: "gatepasses", badge: true },
  { id: "gplogs", label: "GP Activity Log", path: "/gp-activity-log", mod: "gatepasses" },
  { section: "Account" },
  { id: "settings", label: "Settings", path: "/settings", mod: "settings" },
];

export function Sidebar({ officeFull, visitors, gatePasses, user, onOpenOfficePicker, isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { signOut } = useClerk();

  const checkedIn = visitors.filter(v => v.status === "Checked In").length;
  const openGP = gatePasses.filter(g => g.status === "Open").length;

  const officeParts = officeFull.split("—");
  const officeName = officeParts[0]?.trim() ?? officeFull;
  const officeSub = officeParts[1]?.trim() ?? "";

  const isAdmin = user.role === "super_admin";

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/25 z-40 md:hidden" onClick={onClose} />
      )}
      <nav className={cn(
        "w-[228px] bg-card border-r border-border flex flex-col flex-shrink-0 z-50",
        "fixed left-0 top-0 bottom-0 transition-transform duration-250 ease-in-out md:static md:translate-x-0",
        isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full",
      )}>
        <div className="px-4 py-[18px] pb-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-[30px] h-[30px] bg-primary rounded-[7px] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="w-4 h-4">
                <rect x="3" y="4" width="14" height="10" rx="2"/>
                <path d="M7 8h6M7 11h4"/>
                <rect x="7" y="17" width="10" height="3" rx="1.5"/>
              </svg>
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-foreground">GatePass</div>
              <div className="text-[9px] text-muted-foreground tracking-wider mt-0.5">Visitor & Pass Management</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-1.5 py-2">
          {navItems.map((item, idx) => {
            if ("section" in item) {
              return (
                <div key={idx} className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold px-2.5 pt-3.5 pb-1.5">
                  {item.section}
                </div>
              );
            }
            const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path!);
            const isGP = item.mod === "gatepasses";
            const badge = item.badge ? (isGP ? openGP : checkedIn) : 0;

            return (
              <Link key={item.id} href={item.path!} onClick={onClose}>
                <div className={cn(
                  "flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-[13px] font-medium mb-0.5 transition-all duration-100 select-none",
                  isActive && !isGP && "bg-orange-50 text-orange-700",
                  isActive && isGP && "bg-teal-50 text-teal-700",
                  !isActive && "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}>
                  <NavIcon id={item.id!} />
                  <span className="flex-1">{item.label}</span>
                  {!!badge && (
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white",
                      isGP ? "bg-teal-600" : "bg-primary"
                    )}>
                      {badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold px-2.5 pt-3.5 pb-1.5">
                Administration
              </div>
              <Link href="/admin" onClick={onClose}>
                <div className={cn(
                  "flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-[13px] font-medium mb-0.5 transition-all duration-100 select-none",
                  location === "/admin" ? "bg-purple-50 text-purple-700" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="flex-1">{user.role === "super_admin" ? "Super Admin" : "Admin Panel"}</span>
                </div>
              </Link>
            </>
          )}
        </div>

        <div className="px-3 py-2.5 border-t border-border space-y-2">
          <button
            onClick={onOpenOfficePicker}
            className="w-full bg-secondary border border-border rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:border-border/80 transition-colors text-left"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-foreground leading-tight truncate">{officeName || "Select office"}</div>
              {officeSub && <div className="text-[9.5px] text-muted-foreground truncate">{officeSub}</div>}
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </button>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="flex-1 text-left truncate">{user.name}</span>
            <span className="text-[9.5px] opacity-50">Sign out</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function NavIcon({ id }: { id: string }) {
  const icons: Record<string, React.ReactNode> = {
    settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    visitors: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    logs: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    "visitor-link": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    gpdashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    gatepasses: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
    gplogs: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  };
  return icons[id] ?? <span className="w-4 h-4 flex-shrink-0" />;
}
