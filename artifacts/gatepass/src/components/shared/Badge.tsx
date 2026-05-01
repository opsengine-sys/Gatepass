import { cn } from "@/lib/utils";
import type { VisitorType, VisitorStatus, GPStatus } from "@/types";

const typeColorMap: Record<VisitorType, string> = {
  vendor: "bg-amber-100 text-amber-800 border-amber-200",
  candidate: "bg-blue-100 text-blue-800 border-blue-200",
  guest: "bg-green-100 text-green-800 border-green-200",
  leadership: "bg-purple-100 text-purple-800 border-purple-200",
  employee: "bg-slate-100 text-slate-700 border-slate-200",
};

const typeLabel: Record<VisitorType, string> = {
  vendor: "Vendor",
  candidate: "Interview Candidate",
  guest: "Guest",
  leadership: "Leadership Visit",
  employee: "Employee (Forgot ID)",
};

const statusColorMap: Record<string, string> = {
  "checked-in": "bg-green-100 text-green-800 border-green-200",
  "checked-out": "bg-slate-100 text-slate-600 border-slate-200",
  "pending": "bg-amber-100 text-amber-800 border-amber-200",
  "on-break": "bg-amber-100 text-amber-800 border-amber-200",
  "open": "bg-green-100 text-green-800 border-green-200",
  "closed": "bg-slate-100 text-slate-600 border-slate-200",
};

const statusLabel: Record<string, string> = {
  "checked-in": "Checked In",
  "checked-out": "Checked Out",
  "pending": "Pending",
  "on-break": "On Break",
  "open": "Open",
  "closed": "Closed",
};

interface BadgeProps {
  className?: string;
}

export function TypeBadge({ type, className }: { type: VisitorType } & BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border", typeColorMap[type], className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      {typeLabel[type]}
    </span>
  );
}

export function StatusBadge({ status, onBreak, className }: { status: VisitorStatus | GPStatus; onBreak?: boolean } & BadgeProps) {
  const key = onBreak ? "on-break" : status;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border", statusColorMap[key] || "bg-slate-100 text-slate-600 border-slate-200", className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      {statusLabel[key] || status}
    </span>
  );
}

export function GPTypeBadge({ type, className }: { type: string } & BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-teal-50 text-teal-800 border border-teal-200", className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      {type}
    </span>
  );
}
