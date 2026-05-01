import { useState } from "react";
import type { VisitorLog, Visitor } from "@/types";
import { fmtDT, sameDay2 } from "@/hooks/useAppState";
import { TypeBadge } from "@/components/shared/Badge";
import { cn } from "@/lib/utils";

interface Props {
  logs: VisitorLog[];
  visitors: Visitor[];
  office: string;
}

const logColors: Record<string, { bg: string; text: string; label: string }> = {
  checkin: { bg: "bg-green-50", text: "text-green-700", label: "Check-in" },
  "break-out": { bg: "bg-amber-50", text: "text-amber-700", label: "Break Out" },
  "break-return": { bg: "bg-blue-50", text: "text-blue-700", label: "Break Return" },
  checkout: { bg: "bg-slate-100", text: "text-slate-600", label: "Check-out" },
};

export function ActivityLog({ logs, visitors, office }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const offLogs = logs.filter(l => l.office === office);
  const filtered = offLogs.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.visitor.toLowerCase().includes(q) || (l.vid?.toLowerCase().includes(q) ?? false) || (l.note?.toLowerCase().includes(q) ?? false);
    const matchType = typeFilter === "all" || l.type === typeFilter;
    return matchSearch && matchType;
  }).reverse();

  const todayCount = offLogs.filter(l => sameDay2(l.time, new Date())).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-serif text-[21px] font-medium text-foreground">Activity Log</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">{office} · {todayCount} events today</p>
        </div>
        <div className="text-[11px] font-semibold bg-secondary border border-border rounded-full px-3 py-1.5 text-muted-foreground">
          {offLogs.length} total events
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            placeholder="Search by name, ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="all">All Events</option>
          <option value="checkin">Check-in</option>
          <option value="break-out">Break Out</option>
          <option value="break-return">Break Return</option>
          <option value="checkout">Check-out</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-[13.5px] font-semibold text-foreground/70">No events found</p>
          </div>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Time</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Visitor</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden md:table-cell">ID</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Event</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const evStyle = logColors[l.type] ?? { bg: "bg-secondary", text: "text-muted-foreground", label: l.type };
                const visitor = visitors.find(v => v.visitorId === l.vid);
                return (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-[11px] whitespace-nowrap">{fmtDT(l.time)}</td>
                    <td className="px-4 py-2.5 font-medium text-foreground">{l.visitor}</td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      {l.vid && (
                        <span className="font-mono text-[11px] bg-secondary border border-border px-2 py-0.5 rounded-md">
                          {l.vid.split("-").slice(0,2).join("-")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("text-[10.5px] font-bold px-2 py-0.5 rounded-full", evStyle.bg, evStyle.text)}>
                        {evStyle.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      {visitor && <TypeBadge type={visitor.type} />}
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell text-muted-foreground text-[11.5px]">
                      {l.note || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
