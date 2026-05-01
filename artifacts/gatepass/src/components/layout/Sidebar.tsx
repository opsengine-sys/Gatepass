import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import type { Visitor, GatePass } from "@/types";

interface SidebarProps {
  office: string;
  visitors: Visitor[];
  gatePasses: GatePass[];
  onOpenOfficePicker: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { section: "Visitor Management" },
  { id: "dashboard", label: "Dashboard", path: "/", mod: "visitors" },
  { id: "visitors", label: "Visitors", path: "/visitors", mod: "visitors", badge: true },
  { id: "logs", label: "Activity Log", path: "/activity-log", mod: "visitors" },
  { id: "visitor-link", label: "Visitor Link", path: "/visitor-link", mod: "visitors" },
  { section: "Gate Passes" },
  { id: "gpdashboard", label: "GP Dashboard", path: "/gp-dashboard", mod: "gatepasses" },
  { id: "gatepasses", label: "Gate Passes", path: "/gate-passes", mod: "gatepasses", badge: true },
  { id: "gplogs", label: "GP Activity Log", path: "/gp-activity-log", mod: "gatepasses" },
];

export function Sidebar({ office, visitors, gatePasses, onOpenOfficePicker, isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const checkedIn = visitors.filter(v => v.office === office && v.status === "checked-in").length;
  const openGP = gatePasses.filter(g => g.office === office && g.status === "open").length;

  const officeParts = office.split("—");
  const officeName = officeParts[0]?.trim() ?? office;
  const officeSub = officeParts[1]?.trim() ?? "";

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
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
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
        </div>

        <div className="px-3 py-2.5 border-t border-border">
          <button
            onClick={onOpenOfficePicker}
            className="w-full bg-secondary border border-border rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:border-border/80 transition-colors text-left"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-foreground leading-tight truncate">{officeName}</div>
              <div className="text-[9.5px] text-muted-foreground truncate">{officeSub}</div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </button>
        </div>
      </nav>
    </>
  );
}

function NavIcon({ id }: { id: string }) {
  const icons: Record<string, React.ReactNode> = {
    dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    visitors: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    logs: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    "visitor-link": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    gpdashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    gatepasses: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
    gplogs: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  };
  return <>{icons[id] || null}</>;
}
