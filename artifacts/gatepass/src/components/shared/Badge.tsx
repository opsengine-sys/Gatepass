import { cn } from "@/lib/utils";

const typeColorMap: Record<string, string> = {
  Vendor: "bg-amber-100 text-amber-800 border-amber-200",
  Guest: "bg-green-100 text-green-800 border-green-200",
  Contractor: "bg-orange-100 text-orange-800 border-orange-200",
  "Interview Candidate": "bg-blue-100 text-blue-800 border-blue-200",
  "Leadership Visit": "bg-purple-100 text-purple-800 border-purple-200",
  "Employee (Forgot ID)": "bg-slate-100 text-slate-700 border-slate-200",
  Auditor: "bg-red-100 text-red-800 border-red-200",
  Delivery: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Other: "bg-secondary text-muted-foreground border-border",
};

const statusColorMap: Record<string, string> = {
  "Checked In": "bg-green-100 text-green-800 border-green-200",
  "Checked Out": "bg-slate-100 text-slate-600 border-slate-200",
  "Pending": "bg-amber-100 text-amber-800 border-amber-200",
  "On Break": "bg-amber-100 text-amber-800 border-amber-200",
  "Open": "bg-green-100 text-green-800 border-green-200",
  "Closed": "bg-slate-100 text-slate-600 border-slate-200",
  "Returned": "bg-blue-100 text-blue-800 border-blue-200",
  "Expired": "bg-red-100 text-red-800 border-red-200",
};

interface BadgeProps {
  className?: string;
}

export function TypeBadge({ type, className }: { type: string } & BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border",
      typeColorMap[type] ?? "bg-secondary text-muted-foreground border-border",
      className,
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      {type}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string } & BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold border",
      statusColorMap[status] ?? "bg-secondary text-muted-foreground border-border",
      className,
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      {status}
    </span>
  );
}

export function GPTypeBadge({ type, className }: { type: string } & BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-teal-50 text-teal-800 border border-teal-200",
      className,
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      {type}
    </span>
  );
}
