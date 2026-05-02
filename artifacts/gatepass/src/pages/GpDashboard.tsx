import type { GatePass, GPLog } from "@/types";
import { StatCard } from "@/components/shared/StatCard";
import { GPTypeBadge, StatusBadge } from "@/components/shared/Badge";
import { fmtDate, fmtDateTime, sameDay } from "@/lib/time";

interface Props {
  gatePasses: GatePass[];
  gpLogs: GPLog[];
  officeFull: string;
  onDetail: (id: string) => void;
  onNew?: () => void;
}

export function GpDashboard({ gatePasses, gpLogs, officeFull, onDetail, onNew }: Props) {
  const openCount = gatePasses.filter(g => g.status === "Open").length;
  const closedToday = gatePasses.filter(g => g.status === "Closed" && g.closedAt && sameDay(g.closedAt, new Date())).length;
  const createdToday = gatePasses.filter(g => sameDay(g.createdAt, new Date())).length;
  const totalItems = gatePasses.filter(g => g.status === "Open").reduce((acc, g) => acc + (g.items?.length ?? 0), 0);

  const recent = [...gatePasses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentLogs = [...gpLogs]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 8);

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-semibold text-[21px] tracking-tight text-foreground">Gate Pass Dashboard</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">{officeFull}</p>
        </div>
        {onNew && (
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 bg-teal-600 text-white px-3.5 py-2 rounded-lg text-[12.5px] font-semibold hover:bg-teal-700 transition-colors flex-shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3.5 h-3.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Gate Pass
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Open Passes" value={openCount} color="teal"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>}
        />
        <StatCard label="Closed Today" value={closedToday} color="green"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>}
        />
        <StatCard label="Created Today" value={createdToday} color="blue"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
        />
        <StatCard label="Items In Transit" value={totalItems} color="amber"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3.5">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3">
            <h2 className="font-bold text-[13px] text-foreground">Recent Gate Passes</h2>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-[14px] font-semibold text-foreground/70 mb-1">No gate passes yet</p>
            </div>
          ) : recent.map(g => (
            <div
              key={g.id}
              className="flex items-center gap-3 px-5 py-2.5 border-b border-border last:border-0 cursor-pointer hover:bg-secondary/50"
              onClick={() => onDetail(g.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] text-foreground font-mono">{g.passId}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{g.purpose}</div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <StatusBadge status={g.status} />
                  <GPTypeBadge type={g.type} />
                  <span className="text-[10.5px] text-muted-foreground">{g.items?.length ?? 0} item{(g.items?.length ?? 0) !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[11px] text-muted-foreground">{fmtDate(g.createdAt)}</div>
                {g.requestedBy && <div className="text-[11px] text-muted-foreground">{g.requestedBy}</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3">
            <h2 className="font-bold text-[13px] text-foreground">GP Activity Log</h2>
          </div>
          <div className="px-5 pb-4">
            {recentLogs.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No activity yet</p>
            ) : recentLogs.map(l => (
              <div key={l.id} className="flex gap-2.5 py-2 border-b border-border last:border-0">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${l.action === "created" ? "bg-teal-600" : "bg-slate-400"}`} />
                <div>
                  <div className="text-[12.5px] font-medium text-foreground">
                    <span className="font-mono">{l.passId}</span>{" "}
                    <span className="text-muted-foreground font-normal">{l.action}</span>
                  </div>
                  <div className="text-[10.5px] text-muted-foreground mt-0.5">{fmtDateTime(l.ts)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
