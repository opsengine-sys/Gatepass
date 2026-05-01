import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Office } from "@/types";
import { cn } from "@/lib/utils";

interface OfficePickerProps {
  open: boolean;
  currentOfficeId: string;
  offices: Office[];
  onSelect: (officeId: string) => void;
  onClose: () => void;
}

export function OfficePicker({ open, currentOfficeId, offices, onSelect, onClose }: OfficePickerProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[19px] font-medium">Select Office</DialogTitle>
          <p className="text-[12.5px] text-muted-foreground">Data shown will be filtered to this location</p>
        </DialogHeader>
        <div className="mt-1 space-y-1">
          {offices.length === 0 && (
            <p className="text-[13px] text-muted-foreground py-4 text-center">No offices found</p>
          )}
          {offices.map(o => (
            <button
              key={o.id}
              onClick={() => { onSelect(o.id); onClose(); }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] transition-colors text-left",
                currentOfficeId === o.id
                  ? "bg-orange-50 text-orange-700 font-semibold"
                  : "hover:bg-secondary text-foreground"
              )}
            >
              <div>
                <div className="font-medium">{o.name}</div>
                <div className="text-[11px] text-muted-foreground">{o.city}{o.address ? ` · ${o.address}` : ""}</div>
              </div>
              {currentOfficeId === o.id && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 flex-shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
