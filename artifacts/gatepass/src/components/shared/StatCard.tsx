interface StatCardProps {
  label: string;
  value: number | string;
  delta?: string;
  color: "green" | "amber" | "blue" | "purple" | "teal" | "slate";
  icon: React.ReactNode;
}

const colorMap: Record<StatCardProps["color"], { bg: string; text: string }> = {
  green: { bg: "bg-green-50", text: "text-green-700" },
  amber: { bg: "bg-amber-50", text: "text-amber-700" },
  blue: { bg: "bg-blue-50", text: "text-blue-700" },
  purple: { bg: "bg-purple-50", text: "text-purple-700" },
  teal: { bg: "bg-teal-50", text: "text-teal-700" },
  slate: { bg: "bg-slate-100", text: "text-slate-600" },
};

export function StatCard({ label, value, delta, color, icon }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className={`w-8 h-8 rounded-lg ${c.bg} ${c.text} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-[10.5px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">{label}</div>
      <div className="text-3xl font-bold text-foreground leading-none">{value}</div>
      {delta && <div className="text-[10.5px] text-muted-foreground mt-1">{delta}</div>}
    </div>
  );
}
