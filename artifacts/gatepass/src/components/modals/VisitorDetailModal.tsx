import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Visitor } from "@/types";
import { VISITOR_TYPES, POC_CFG, NEEDS_PURPOSE } from "@/types";
import { TypeBadge, StatusBadge } from "@/components/shared/Badge";
import { Avatar } from "@/components/shared/Avatar";
import { VisitorIDChip } from "@/components/shared/VisitorIDChip";
import { fmtDT, fmtTime, sameDay2 } from "@/hooks/useAppState";

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

  const t = VISITOR_TYPES.find(x => x.id === v.type);
  const poc = POC_CFG[v.type];
  const ciToday = v.status === "checked-in";
  const coToday = v.status === "checked-out" && !!v.checkout && sameDay2(v.checkout, new Date());
  const canCheckin = v.status !== "checked-in" && !coToday;

  const details: [string, string | undefined][] = [
    ["Email", v.email],
    ["Phone", v.phone],
    ...(poc.show ? [[poc.hostLabel ?? "Host", v.host], [poc.phoneLabel ?? "Host Phone", v.hostPhone]] as [string, string | undefined][] : []),
    ...(NEEDS_PURPOSE[v.type] ? [["Purpose", v.purpose]] as [string, string | undefined][] : []),
    ["Office", v.office],
    ...(v.address ? [["Address", v.address]] as [string, string | undefined][] : []),
    ["Check-in", fmtDT(v.checkin)],
    ["Check-out", v.checkout ? fmtDT(v.checkout) : "Still inside"],
    ...(v.contractRef ? [["Contract / PO Ref", v.contractRef]] as [string, string | undefined][] : []),
    ...(v.serviceType ? [["Service Category", v.serviceType]] as [string, string | undefined][] : []),
    ...(v.jobId ? [["Job ID", v.jobId]] as [string, string | undefined][] : []),
    ...(v.interviewRound ? [["Interview Round", v.interviewRound]] as [string, string | undefined][] : []),
    ...(v.relationship ? [["Relationship", v.relationship]] as [string, string | undefined][] : []),
    ...(v.homeOffice ? [["Home Office", v.homeOffice]] as [string, string | undefined][] : []),
    ...(v.visitAgenda ? [["Visit Agenda", v.visitAgenda]] as [string, string | undefined][] : []),
    ...(v.employeeId ? [["Employee ID", v.employeeId]] as [string, string | undefined][] : []),
    ...(v.department ? [["Department", v.department]] as [string, string | undefined][] : []),
  ].filter(([, val]) => val && val !== "—");

  return (
    <Dialog open={!!v} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-[560px] max-h-[93vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-[19px] font-medium">{v.name}</DialogTitle>
          <p className="text-[12.5px] text-muted-foreground">{v.company || "No company"}</p>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={v.name} photo={v.photo} size={48} />
            <div>
              <div className="flex gap-1.5 flex-wrap mb-1.5">
                <TypeBadge type={v.type} />
                <StatusBadge status={v.status} onBreak={v.onBreak} />
              </div>
              <div className="flex items-center gap-2">
                <VisitorIDChip visitor={v} />
                <span className={`text-[10px] font-semibold ${v.status === "checked-in" || v.status === "pending" ? "text-green-600" : "text-muted-foreground"}`}>
                  {v.status === "checked-in" || v.status === "pending" ? "Valid until check-out" : "Expired"}
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

          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold pb-2 border-b border-border mb-3">
              Break History ({v.breaks.length})
            </div>
            {v.breaks.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground">No breaks taken</p>
            ) : v.breaks.map((b, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2 border-b border-border last:border-0 text-[12.5px]">
                <span className="font-semibold text-foreground">Break {i + 1}</span>
                <span className="text-muted-foreground">Out: {fmtTime(b.out)}</span>
                <span className="text-muted-foreground">
                  {b.returnTime ? `Returned: ${fmtTime(b.returnTime)}` : "Still outside"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {canCheckin && (
            <button className="btn-success" onClick={() => { onCheckIn(v.id); onClose(); }}>
              <LoginIcon /> Check In
            </button>
          )}
          {ciToday && !v.onBreak && (
            <button className="btn-amber" onClick={() => { onBreakOut(v.id); onClose(); }}>
              <CoffeeIcon /> Step Out
            </button>
          )}
          {v.onBreak && (
            <button className="btn-success" onClick={() => { onBreakReturn(v.id); onClose(); }}>
              <CheckIcon /> Return
            </button>
          )}
          {ciToday && (
            <button className="btn-danger" onClick={() => { onCheckOut(v.id); onClose(); }}>
              <LogoutIcon /> Check Out
            </button>
          )}
          {t?.needsBadge && (
            <button className="btn-ghost" onClick={() => { onOpenBadge(v.id); onClose(); }}>
              <BadgeIcon /> Badge
            </button>
          )}
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoginIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>; }
function LogoutIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function CoffeeIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>; }
function BadgeIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><circle cx="12" cy="10" r="3"/></svg>; }
