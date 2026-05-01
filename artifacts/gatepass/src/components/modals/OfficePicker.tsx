import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OFFICES } from "@/types";
import { cn } from "@/lib/utils";

interface OfficePickerProps {
  open: boolean;
  currentOffice: string;
  onSelect: (office: string) => void;
  onClose: () => void;
}

export function OfficePicker({ open, currentOffice, onSelect, onClose }: OfficePickerProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[19px] font-medium">Select Office</DialogTitle>
          <p className="text-[12.5px] text-muted-foreground">Data shown will be filtered to this location</p>
        </DialogHeader>
        <div className="mt-1 space-y-1">
          {OFFICES.map(o => (
            <button
              key={o}
              onClick={() => { onSelect(o); onClose(); }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] transition-colors text-left",
                currentOffice === o
                  ? "bg-orange-50 text-orange-700 font-semibold"
                  : "hover:bg-secondary text-foreground"
              )}
            >
              <span>{o}</span>
              {currentOffice === o && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
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
