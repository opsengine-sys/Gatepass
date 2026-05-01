import { StatCard } from "@/components/shared/StatCard";
import { Avatar } from "@/components/shared/Avatar";
import { TypeBadge } from "@/components/shared/Badge";
import { VisitorIDChip } from "@/components/shared/VisitorIDChip";
import type { Visitor, VisitorLog } from "@/types";
import { fmtTime, fmtDate, sameDay } from "@/lib/time";

interface Props {
  visitors: Visitor[];
  logs: VisitorLog[];
  officeFull: string;
}

export function Dashboard({ visitors, logs, officeFull }: Props) {
  const today = new Date();

  const active = visitors.filter(v => v.status === "Checked In");
  const onBreak = visitors.filter(v => v.status === "On Break");
  const todayVisitors = visitors.filter(v => sameDay(v.createdAt, today));
  const pending = visitors.filter(v => v.status === "Pending");
  const recentLogs = [...logs].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 8);

  const logColors: Record<string, string> = {
    "checked in": "bg-green-400",
    "stepped out": "bg-amber-400",
    "returned from break": "bg-blue-400",
    "checked out": "bg-slate-400",
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-serif text-[21px] font-medium text-foreground">Visitor Overview</h1>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">{officeFull}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Currently Inside" value={active.length} delta="Active right now" color="green"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard label="On Break" value={onBreak.length} delta="Stepped out temporarily" color="amber"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/></svg>}
        />
        <StatCard label="Today's Visitors" value={todayVisitors.length} delta={fmtDate(today.toISOString())} color="blue"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
        />
        <StatCard label="Pending Entry" value={pending.length} delta="Registered, not arrived" color="purple"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="15" y1="11" x2="21" y2="11"/></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3.5">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h2 className="font-bold text-[13px] text-foreground">
              Active Visitors — {officeFull.split("—")[0]?.trim()}
            </h2>
          </div>
          {active.length + onBreak.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-9 h-9 opacity-20 mx-auto mb-2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <p className="text-[14px] font-semibold text-foreground/70 mb-1">All clear</p>
              <p className="text-[12.5px]">No visitors currently inside</p>
            </div>
          ) : [...active, ...onBreak].map(v => (
            <div key={v.id} className="flex items-center gap-2.5 px-5 py-2.5 border-b border-border last:border-0">
              <Avatar name={v.name} photo={v.photoUrl} size={30} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] text-foreground">{v.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <VisitorIDChip id={v.visitorId} status={v.status} />
                  {v.status === "On Break" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 rounded-full px-2 py-0.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/></svg>
                      On Break
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">since {fmtTime(v.checkInTime)}</span>
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
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${logColors[l.action] || "bg-slate-400"}`} />
                <div>
                  <div className="text-[12.5px] font-medium text-foreground">
                    {l.name} <span className="text-muted-foreground font-normal">{l.action}</span>
                  </div>
                  <div className="text-[10.5px] text-muted-foreground mt-0.5">
                    {fmtTime(l.ts)}{l.note ? ` · ${l.note}` : ""}
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
