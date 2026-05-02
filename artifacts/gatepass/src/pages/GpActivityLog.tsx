import { useState } from "react";
import type { GPLog } from "@/types";
import { fmtDateTime, sameDay } from "@/lib/time";
import { cn } from "@/lib/utils";

interface Props {
  gpLogs: GPLog[];
  officeFull: string;
}

const logStyles: Record<string, { bg: string; text: string }> = {
  created: { bg: "bg-teal-50", text: "text-teal-700" },
  closed: { bg: "bg-slate-100", text: "text-slate-600" },
  updated: { bg: "bg-blue-50", text: "text-blue-700" },
};

export function GpActivityLog({ gpLogs, officeFull }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const todayCount = gpLogs.filter(l => sameDay(l.ts, new Date())).length;

  const filtered = [...gpLogs]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .filter(l => {
      const q = search.toLowerCase();
      const matchSearch = !q || l.passId.toLowerCase().includes(q) || (l.note?.toLowerCase().includes(q) ?? false);
      const matchFilter = filter === "all" || l.action === filter;
      return matchSearch && matchFilter;
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-semibold text-[21px] tracking-tight text-foreground">GP Activity Log</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">{officeFull} · {todayCount} events today</p>
        </div>
        <div className="text-[11px] font-semibold bg-secondary border border-border rounded-full px-3 py-1.5 text-muted-foreground">
          {gpLogs.length} total events
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
            placeholder="Search by pass ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All Events</option>
          <option value="created">Created</option>
          <option value="closed">Closed</option>
          <option value="updated">Updated</option>
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
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Pass ID</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden md:table-cell">By / Note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const s = logStyles[l.action] ?? { bg: "bg-secondary", text: "text-muted-foreground" };
                return (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-[11px] whitespace-nowrap">{fmtDateTime(l.ts)}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[11.5px] font-bold text-teal-700">{l.passId}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("text-[10.5px] font-bold px-2 py-0.5 rounded-full capitalize", s.bg, s.text)}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground text-[11.5px]">
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
