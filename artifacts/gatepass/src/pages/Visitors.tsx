import { useState } from "react";
import type { Visitor } from "@/types";
import { VISITOR_TYPES } from "@/types";
import { TypeBadge, StatusBadge } from "@/components/shared/Badge";
import { Avatar } from "@/components/shared/Avatar";
import { VisitorIDChip } from "@/components/shared/VisitorIDChip";
import { fmtTime, sameDay2 } from "@/hooks/useAppState";
import { cn } from "@/lib/utils";

interface Props {
  visitors: Visitor[];
  office: string;
  onRegister: () => void;
  onDetail: (id: string) => void;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  onBreakOut: (id: string) => void;
  onBreakReturn: (id: string) => void;
  onOpenBadge: (id: string) => void;
}

export function Visitors({
  visitors, office, onRegister, onDetail, onCheckIn, onCheckOut, onBreakOut, onBreakReturn, onOpenBadge,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const loc = visitors.filter(v => v.office === office);
  const filtered = loc.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !q || v.name.toLowerCase().includes(q) || v.visitorId.toLowerCase().includes(q)
      || (v.company?.toLowerCase().includes(q) ?? false) || (v.host?.toLowerCase().includes(q) ?? false);
    const matchStatus = filter === "all"
      || (filter === "in" && v.status === "checked-in" && !v.onBreak)
      || (filter === "break" && v.onBreak)
      || (filter === "out" && v.status === "checked-out")
      || (filter === "pending" && v.status === "pending");
    const matchType = typeFilter === "all" || v.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const ciCount = loc.filter(v => v.status === "checked-in").length;
  const coCount = loc.filter(v => v.status === "checked-out" && sameDay2(v.checkout!, new Date())).length;
  const breakCount = loc.filter(v => v.onBreak).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-serif text-[21px] font-medium text-foreground">Visitors</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">{office}</p>
        </div>
        <button onClick={onRegister} className="btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Register Visitor
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-3">
        {[
          { id: "all", label: "All" },
          { id: "in", label: `Inside (${ciCount})` },
          { id: "break", label: `On Break (${breakCount})` },
          { id: "out", label: `Checked Out (${coCount})` },
          { id: "pending", label: "Pending" },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={cn(
              "text-[11.5px] font-semibold px-3.5 py-1.5 rounded-full border-[1.5px] transition-all",
              filter === s.id
                ? "bg-orange-50 border-orange-400 text-orange-700"
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
            placeholder="Search by name, ID, host…"
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
          {VISITOR_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-9 h-9 opacity-20 mx-auto mb-3">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
            <p className="text-[13.5px] font-semibold text-foreground/70">No visitors found</p>
          </div>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Visitor</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden md:table-cell">ID</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Host</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">In / Out</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <VisitorRow
                  key={v.id}
                  visitor={v}
                  onClick={() => onDetail(v.id)}
                  onCheckIn={() => onCheckIn(v.id)}
                  onCheckOut={() => onCheckOut(v.id)}
                  onBreakOut={() => onBreakOut(v.id)}
                  onBreakReturn={() => onBreakReturn(v.id)}
                  onBadge={() => onOpenBadge(v.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function VisitorRow({ visitor: v, onClick, onCheckIn, onCheckOut, onBreakOut, onBreakReturn, onBadge }: {
  visitor: Visitor;
  onClick: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onBreakOut: () => void;
  onBreakReturn: () => void;
  onBadge: () => void;
}) {
  const isIn = v.status === "checked-in" && !v.onBreak;
  const isBreak = v.onBreak;
  const isOut = v.status === "checked-out";
  const today = isOut && sameDay2(v.checkout!, new Date());

  return (
    <tr className="border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer transition-colors" onClick={onClick}>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <Avatar name={v.name} photo={v.photo} size={30} />
          <div>
            <div className="font-semibold text-[13px] text-foreground">{v.name}</div>
            {v.company && <div className="text-[11px] text-muted-foreground">{v.company}</div>}
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5 hidden md:table-cell">
        <VisitorIDChip visitor={v} />
      </td>
      <td className="px-4 py-2.5 hidden sm:table-cell">
        <TypeBadge type={v.type} />
      </td>
      <td className="px-4 py-2.5">
        <StatusBadge status={v.status} onBreak={v.onBreak} />
      </td>
      <td className="px-4 py-2.5 hidden lg:table-cell text-[12px] text-muted-foreground">
        {v.host || "—"}
      </td>
      <td className="px-4 py-2.5 text-[11.5px] text-muted-foreground">
        {fmtTime(v.checkin)}{v.checkout ? ` → ${fmtTime(v.checkout)}` : ""}
      </td>
      <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
        <div className="flex gap-1 justify-end">
          {!isIn && !isBreak && !today && (
            <ActionButton label="In" color="green" onClick={onCheckIn} />
          )}
          {isIn && <ActionButton label="Break" color="amber" onClick={onBreakOut} />}
          {isBreak && <ActionButton label="Return" color="blue" onClick={onBreakReturn} />}
          {(isIn || isBreak) && <ActionButton label="Out" color="red" onClick={onCheckOut} />}
          <ActionButton label="Badge" color="slate" onClick={onBadge} />
        </div>
      </td>
    </tr>
  );
}

function ActionButton({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  const cls = {
    green: "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200",
    amber: "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200",
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200",
    red: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    slate: "bg-secondary text-muted-foreground hover:bg-secondary/80 border border-border",
  }[color] || "bg-secondary text-muted-foreground border border-border";

  return (
    <button onClick={onClick} className={cn("text-[10.5px] font-bold px-2 py-1 rounded-md cursor-pointer transition-colors", cls)}>
      {label}
    </button>
  );
}
