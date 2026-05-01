import { StatCard } from "@/components/shared/StatCard";
import { Avatar } from "@/components/shared/Avatar";
import { TypeBadge } from "@/components/shared/Badge";
import { VisitorIDChip } from "@/components/shared/VisitorIDChip";
import type { Visitor, VisitorLog } from "@/types";
import { fmtTime, fmtDate, sameDay2 } from "@/hooks/useAppState";

interface Props {
  visitors: Visitor[];
  logs: VisitorLog[];
  office: string;
}

export function Dashboard({ visitors, logs, office }: Props) {
  const loc = visitors.filter(v => v.office === office);
  const ci = loc.filter(v => v.status === "checked-in").length;
  const onBreak = loc.filter(v => v.onBreak).length;
  const today = loc.filter(v => sameDay2(v.checkin, new Date())).length;
  const pending = loc.filter(v => v.status === "pending").length;

  const active = loc.filter(v => v.status === "checked-in" || v.onBreak);
  const recentLogs = logs.filter(l => l.office === office).slice(-8).reverse();

  const logColors: Record<string, string> = {
    checkin: "#1a7a4a",
    "break-out": "#a07a14",
    "break-return": "#2558a8",
    checkout: "#7a7769",
  };
  const logLabels: Record<string, string> = {
    checkin: "checked in",
    "break-out": "stepped out",
    "break-return": "returned",
    checkout: "checked out",
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-serif text-[21px] font-medium text-foreground">Visitor Overview</h1>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">{office}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Currently Inside" value={ci} delta="Active right now" color="green"
          icon={<UsersIcon />} />
        <StatCard label="On Break" value={onBreak} delta="Stepped out temporarily" color="amber"
          icon={<CoffeeIcon />} />
        <StatCard label="Today's Visitors" value={today} delta={fmtDate(new Date())} color="blue"
          icon={<UsersIcon />} />
        <StatCard label="Pending Entry" value={pending} delta="Registered, not arrived" color="purple"
          icon={<UsersIcon />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3.5">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h2 className="font-bold text-[13px] text-foreground">Active Visitors — {office.split("—")[0].trim()}</h2>
          </div>
          {active.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-9 h-9 opacity-20 mx-auto mb-2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <p className="text-[14px] font-semibold text-foreground/70 mb-1">All clear</p>
              <p className="text-[12.5px]">No visitors at {office.split("—")[0].trim()}</p>
            </div>
          ) : active.map(v => (
            <div key={v.id} className="flex items-center gap-2.5 px-5 py-2.5 border-b border-border last:border-0">
              <Avatar name={v.name} photo={v.photo} size={32} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] text-foreground">{v.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <VisitorIDChip visitor={v} />
                  {v.onBreak && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 rounded-full px-2 py-0.5">
                      <CoffeeIcon /> On Break
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">since {fmtTime(v.checkin)}</span>
                </div>
              </div>
              <TypeBadge type={v.type} />
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3">
            <h2 className="font-bold text-[13px] text-foreground">Recent Activity</h2>
          </div>
          <div className="px-5 pb-4">
            {recentLogs.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No activity yet</p>
            ) : recentLogs.map(l => (
              <div key={l.id} className="flex gap-2.5 py-2 border-b border-border last:border-0">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: logColors[l.type] || "#7a7769" }}
                />
                <div>
                  <div className="text-[12.5px] font-medium text-foreground">
                    {l.visitor} <span className="text-muted-foreground font-normal">{logLabels[l.type] || l.type}</span>
                  </div>
                  <div className="text-[10.5px] text-muted-foreground mt-0.5">
                    {fmtTime(l.time)}{l.note ? ` · ${l.note}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function CoffeeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
      <path d="M17 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/>
    </svg>
  );
}
