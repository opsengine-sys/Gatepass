import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Visitor } from "@/types";
import { TypeBadge, StatusBadge } from "@/components/shared/Badge";
import { Avatar } from "@/components/shared/Avatar";
import { VisitorIDChip } from "@/components/shared/VisitorIDChip";
import { fmtDateTime, fmtTime } from "@/lib/time";

interface Props {
  visitor: Visitor | null;
  onClose: () => void;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  onBreakOut: (id: string) => void;
  onBreakReturn: (id: string) => void;
  onOpenBadge: (id: string) => void;
}

export function VisitorDetailModal({ visitor: v, onClose, onCheckIn, onCheckOut, onBreakOut, onBreakReturn, onOpenBadge }: Props) {
  if (!v) return null;

  const isIn = v.status === "Checked In";
  const isBreak = v.status === "On Break";
  const isPending = v.status === "Pending";

  const details: [string, string | null | undefined][] = [
    ["Email", v.email],
    ["Phone", v.phone],
    ["Company", v.company],
    ["Host / Meeting", v.hostName],
    ["Purpose", v.purpose],
    ["ID Type", v.idType],
    ["ID Number", v.idNumber],
    ["Vehicle No.", v.vehicleNumber],
    ["Check-in", v.checkInTime ? fmtDateTime(v.checkInTime) : null],
    ["Check-out", v.checkOutTime ? fmtDateTime(v.checkOutTime) : (isIn || isBreak ? "Still inside" : null)],
  ].filter(([, val]) => val) as [string, string][];

  return (
    <Dialog open={!!v} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-[560px] max-h-[93vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-semibold text-[19px] tracking-tight">{v.name}</DialogTitle>
          <p className="text-[12.5px] text-muted-foreground">{v.company || "No company"}</p>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={v.name} photo={v.photoUrl} size={48} />
            <div>
              <div className="flex gap-1.5 flex-wrap mb-1.5">
                <TypeBadge type={v.type} />
                <StatusBadge status={v.status} />
              </div>
              <div className="flex items-center gap-2">
                <VisitorIDChip id={v.visitorId} status={v.status} />
                <span className={`text-[10px] font-semibold ${isIn || isPending || isBreak ? "text-green-600" : "text-muted-foreground"}`}>
                  {isIn || isPending || isBreak ? "Valid until check-out" : "Expired"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {details.map(([k, val]) => (
              <div key={k} className="bg-secondary rounded-lg px-3 py-2">
                <div className="text-[9.5px] text-muted-foreground uppercase tracking-wide font-bold mb-0.5">{k}</div>
                <div className="text-[12.5px] font-medium text-foreground break-words">{val}</div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {(isPending) && (
            <button className="bg-green-600 text-white font-semibold text-[12.5px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-green-700 transition-colors" onClick={() => { onCheckIn(v.id); onClose(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Check In
            </button>
          )}
          {isIn && (
            <button className="bg-amber-500 text-white font-semibold text-[12.5px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-amber-600 transition-colors" onClick={() => { onBreakOut(v.id); onClose(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/></svg>
              Step Out
            </button>
          )}
          {isBreak && (
            <button className="bg-blue-600 text-white font-semibold text-[12.5px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-blue-700 transition-colors" onClick={() => { onBreakReturn(v.id); onClose(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>
              Return from Break
            </button>
          )}
          {(isIn || isBreak) && (
            <button className="bg-red-600 text-white font-semibold text-[12.5px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-red-700 transition-colors" onClick={() => { onCheckOut(v.id); onClose(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Check Out
            </button>
          )}
          <button className="btn-ghost" onClick={() => { onOpenBadge(v.id); onClose(); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><circle cx="12" cy="10" r="3"/></svg>
            Badge
          </button>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
