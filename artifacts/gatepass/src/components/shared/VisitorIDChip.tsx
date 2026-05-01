import { cn } from "@/lib/utils";

export function VisitorIDChip({ id, status }: { id: string; status?: string }) {
  const active = status === "Checked In";
  const onBreak = status === "On Break";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-mono text-[10px] tracking-wide",
      active && "bg-green-50 border-green-200 text-green-700",
      onBreak && "bg-amber-50 border-amber-200 text-amber-700",
      !active && !onBreak && "bg-secondary border-border text-muted-foreground",
    )}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3 inline">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
      {id || "—"}
    </span>
  );
}
