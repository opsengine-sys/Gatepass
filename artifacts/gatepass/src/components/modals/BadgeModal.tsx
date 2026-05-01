import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Visitor } from "@/types";
import { VISITOR_TYPES, TYPE_COLORS } from "@/types";
import { fmtDate, fmtTime, initials } from "@/hooks/useAppState";
import { toast } from "sonner";

interface Props {
  visitor: Visitor | null;
  onClose: () => void;
}

export function BadgeModal({ visitor: v, onClose }: Props) {
  if (!v) return null;
  const t = VISITOR_TYPES.find(x => x.id === v.type);
  const color = TYPE_COLORS[v.type];

  const copyLink = () => {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}?badge=${encodeURIComponent(v.visitorId)}`;
    navigator.clipboard.writeText(link).then(() => toast.success("Badge link copied"));
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Visitor Badge — ${v.name}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
    <style>
      body{margin:0;padding:20px;background:#f5f4f1;font-family:'Instrument Sans',sans-serif;display:flex;justify-content:center}
      .card{background:#fff;border-radius:14px;width:320px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.12);text-align:center}
      .strip{height:8px;background:${color};width:100%}
      .inner{padding:22px 20px 18px}
      .org{font-size:8px;text-transform:uppercase;letter-spacing:2.5px;color:#999;margin-bottom:14px;font-weight:700}
      .photo{width:68px;height:68px;border-radius:50%;margin:0 auto 12px;border:3px solid #f0eeeb;overflow:hidden;background:#f5f3f0;display:flex;align-items:center;justify-content:center}
      .photo img{width:100%;height:100%;object-fit:cover}
      .init{font-size:20px;font-weight:700;color:#bbb}
      .name{font-size:17px;font-weight:700;margin-bottom:3px}
      .company{font-size:11px;color:#888;margin-bottom:10px}
      .pill{display:inline-block;padding:3px 10px;border-radius:99px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px;background:${color}22;color:${color}}
      .vid{background:#f8f7f4;border:1.5px solid #e8e5df;border-radius:10px;padding:9px 12px;margin-bottom:12px;text-align:left}
      .vid-label{font-size:8px;text-transform:uppercase;letter-spacing:1.5px;color:#aaa;font-weight:700;margin-bottom:4px}
      .vid-val{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;letter-spacing:.5px}
      .vid-valid{font-size:9px;color:#888;margin-top:3px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;text-align:left;margin-bottom:10px}
      .cell{background:#f8f7f4;border-radius:7px;padding:6px 8px}
      .key{font-size:7.5px;text-transform:uppercase;letter-spacing:1px;color:#bbb;font-weight:700;margin-bottom:2px}
      .val{font-size:10.5px;font-weight:600;color:#333}
      .bar{background:#f0efec;border-top:1px solid #eee;padding:7px 12px;font-size:8px;color:#aaa;text-transform:uppercase;letter-spacing:1.2px;display:flex;align-items:center;justify-content:space-between}
    </style></head><body>
    <div class="card">
      <div class="strip"></div>
      <div class="inner">
        <div class="org">GatePass — Visitor Badge</div>
        <div class="photo">${v.photo ? `<img src="${v.photo}"/>` : `<div class="init">${initials(v.name)}</div>`}</div>
        <div class="name">${v.name}</div>
        <div class="company">${v.company || ""}</div>
        <div class="pill">${t?.label || v.type}</div>
        <div class="vid">
          <div class="vid-label">Visitor ID</div>
          <div class="vid-val">${v.visitorId}</div>
          <div class="vid-valid">Valid until check-out</div>
        </div>
        <div class="grid">
          <div class="cell"><div class="key">Host</div><div class="val">${v.host || "—"}</div></div>
          <div class="cell"><div class="key">Office</div><div class="val">${v.office.split("—")[0].trim()}</div></div>
          <div class="cell"><div class="key">Date</div><div class="val">${fmtDate(v.checkin)}</div></div>
          <div class="cell"><div class="key">Time In</div><div class="val">${fmtTime(v.checkin)}</div></div>
        </div>
      </div>
      <div class="bar"><span>${v.office.split("—")[0].trim()}</span><span>${fmtDate(new Date())}</span></div>
    </div>
    </body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <Dialog open={!!v} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-[720px] max-h-[93vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-[19px] font-medium">Visitor Badge</DialogTitle>
          <p className="text-[12.5px] text-muted-foreground">{v.visitorId} · {v.name}</p>
        </DialogHeader>

        <div className="flex gap-5 flex-wrap py-2 items-start">
          <div className="flex-shrink-0">
            <BadgeCard visitor={v} />
          </div>
          <div className="flex-1 min-w-[200px] space-y-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold pb-2 border-b border-border">
              Badge Actions
            </div>
            <div className="flex flex-col gap-2">
              <button className="btn-primary" onClick={handlePrint}>
                <PrintIcon /> Print / Save PDF
              </button>
              <div className="h-px bg-border my-1" />
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Send Badge Link</div>
              <button className="btn-ghost" onClick={copyLink}>
                <CopyIcon /> Copy Badge Link
              </button>
              <button className="btn-ghost" onClick={() => {
                const link = `${window.location.origin}${import.meta.env.BASE_URL}?badge=${encodeURIComponent(v.visitorId)}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(`Your visitor badge — ID: ${v.visitorId} (${v.name}). Valid until check-out. ${link}`)}`);
              }}>
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BadgeCard({ visitor: v }: { visitor: Visitor }) {
  const t = VISITOR_TYPES.find(x => x.id === v.type);
  const color = TYPE_COLORS[v.type];

  return (
    <div className="bg-white rounded-[14px] w-[280px] overflow-hidden shadow-lg text-center font-sans">
      <div className="h-2 w-full" style={{ background: color }} />
      <div className="px-5 py-5">
        <div className="text-[8px] uppercase tracking-[2.5px] text-gray-400 font-bold mb-3">GatePass — Visitor Badge</div>
        <div className="w-[60px] h-[60px] rounded-full mx-auto mb-3 border-[3px] border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center">
          {v.photo
            ? <img src={v.photo} alt={v.name} className="w-full h-full object-cover" />
            : <span className="text-xl font-bold text-gray-300">{initials(v.name)}</span>
          }
        </div>
        <div className="text-[16px] font-bold text-gray-900 mb-0.5">{v.name}</div>
        <div className="text-[10.5px] text-gray-500 mb-2">{v.company || ""}</div>
        <div className="inline-block px-2.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wide mb-3" style={{ background: color + "22", color }}>
          {t?.label || v.type}
        </div>
        <div className="bg-gray-50 border-[1.5px] border-gray-200 rounded-xl px-3 py-2 mb-3 text-left">
          <div className="text-[7.5px] uppercase tracking-widest text-gray-400 font-bold mb-1">Visitor ID</div>
          <div className="font-mono text-[13px] font-bold tracking-wide text-gray-800">{v.visitorId}</div>
          <div className="text-[8.5px] text-gray-400 mt-0.5">Valid until check-out</div>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-left mb-2">
          {[["Host", v.host], ["Office", v.office.split("—")[0].trim()], ["Date", fmtDate(v.checkin)], ["Time In", fmtTime(v.checkin)]].map(([k, val]) => (
            <div key={k} className="bg-gray-50 rounded-lg px-2 py-1.5">
              <div className="text-[7px] uppercase tracking-wide text-gray-400 font-bold mb-0.5">{k}</div>
              <div className="text-[10px] font-semibold text-gray-700">{val || "—"}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-50 border-t border-gray-100 px-3 py-1.5 text-[7.5px] text-gray-400 uppercase tracking-wide flex justify-between">
        <span>{v.office.split("—")[0].trim()}</span>
        <span>{fmtDate(new Date())}</span>
      </div>
    </div>
  );
}

function PrintIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>; }
function CopyIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>; }
