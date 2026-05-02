import { useState } from "react";
import type { GatePass } from "@/types";
import { GP_TYPES } from "@/types";
import { GPTypeBadge, StatusBadge } from "@/components/shared/Badge";
import { fmtDate } from "@/lib/time";
import { cn } from "@/lib/utils";

interface Props {
  gatePasses: GatePass[];
  officeFull: string;
  onNew: () => void;
  onDetail: (id: string) => void;
  onCloseGP: (id: string) => void;
}

export function GatePasses({ gatePasses, officeFull, onNew, onDetail, onCloseGP }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const openCount = gatePasses.filter(g => g.status === "Open").length;
  const closedCount = gatePasses.filter(g => g.status === "Closed").length;

  const filtered = gatePasses.filter(g => {
    const q = search.toLowerCase();
    const matchSearch = !q || g.passId.toLowerCase().includes(q) || g.purpose.toLowerCase().includes(q)
      || (g.requestedBy?.toLowerCase().includes(q) ?? false) || (g.vendorName?.toLowerCase().includes(q) ?? false);
    const matchStatus = filter === "all" || g.status === filter;
    const matchType = typeFilter === "all" || g.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-semibold text-[21px] tracking-tight text-foreground">Gate Passes</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">{officeFull}</p>
        </div>
        <button onClick={onNew} className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Gate Pass
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-3">
        {[
          { id: "all", label: "All" },
          { id: "Open", label: `Open (${openCount})` },
          { id: "Closed", label: `Closed (${closedCount})` },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={cn(
              "text-[11.5px] font-semibold px-3.5 py-1.5 rounded-full border-[1.5px] transition-all",
              filter === s.id
                ? "bg-orange-50 border-primary text-orange-700"
                : "border-border text-muted-foreground hover:border-border/70 hover:bg-secondary"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            placeholder="Search by ID, purpose, vendor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          {GP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-9 h-9 opacity-20 mx-auto mb-3">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>
            </svg>
            <p className="text-[13.5px] font-semibold text-foreground/70">No gate passes found</p>
          </div>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Pass ID</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Purpose</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Requested By</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Date</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Items</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr
                  key={g.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => onDetail(g.id)}
                >
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[11.5px] font-bold text-primary">{g.passId}</span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-foreground max-w-[180px] truncate">{g.purpose}</td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <GPTypeBadge type={g.type} />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={g.status} />
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground">{g.requestedBy || "—"}</td>
                  <td className="px-4 py-2.5 hidden lg:table-cell text-muted-foreground">{fmtDate(g.createdAt)}</td>
                  <td className="px-4 py-2.5 hidden lg:table-cell text-muted-foreground">{g.items?.length ?? 0}</td>
                  <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                    {g.status === "Open" && (
                      <button
                        onClick={() => onCloseGP(g.id)}
                        className="text-[10.5px] font-bold px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                      >
                        Close
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
