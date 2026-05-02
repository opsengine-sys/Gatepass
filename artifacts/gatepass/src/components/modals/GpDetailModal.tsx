import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { GatePass } from "@/types";
import { StatusBadge, GPTypeBadge } from "@/components/shared/Badge";
import { fmtDate, fmtDateTime } from "@/lib/time";

interface Props {
  gatePass: GatePass | null;
  officeFull: string;
  onClose: () => void;
  onCloseGP: (id: string) => void;
}

export function GpDetailModal({ gatePass: g, officeFull, onClose, onCloseGP }: Props) {
  if (!g) return null;

  const officeShort = officeFull.split("—")[0]?.trim() ?? officeFull;

  const details: [string, string | null | undefined][] = [
    ["Requested By", g.requestedBy],
    ["Vendor / Supplier", g.vendorName],
    ["Vehicle No.", g.vehicleNo],
    ["Driver", g.driverName],
    ["Purpose", g.purpose],
    ["Notes", g.notes],
    ["Created", fmtDateTime(g.createdAt)],
    ["Closed", g.closedAt ? fmtDateTime(g.closedAt) : (g.status === "Open" ? "Open" : null)],
  ].filter(([, v]) => v) as [string, string][];

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Gate Pass ${g.passId}</title>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
    <style>
      body{margin:0;padding:20px;background:#f5f4f1;font-family:'Instrument Sans',sans-serif;display:flex;justify-content:center}
      .card{background:#fff;border-radius:14px;width:340px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.12)}
      .strip{height:6px;background:#1a6e7a}
      .inner{padding:20px}
      .org{font-size:8px;letter-spacing:2px;text-transform:uppercase;color:#999;font-weight:700;margin-bottom:12px}
      .title{font-size:15px;font-weight:700;margin-bottom:3px}
      .pill{display:inline-block;padding:2px 9px;border-radius:99px;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;margin-bottom:12px;background:#1a6e7a22;color:#1a6e7a}
      .id-block{background:#f8f7f4;border:1.5px solid #e8e5df;border-radius:9px;padding:9px 12px;margin-bottom:12px}
      .id-label{font-size:8px;text-transform:uppercase;letter-spacing:1.5px;color:#aaa;font-weight:700;margin-bottom:3px}
      .id-val{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;letter-spacing:.5px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px}
      .cell{background:#f8f7f4;border-radius:7px;padding:6px 8px}
      .key{font-size:7.5px;text-transform:uppercase;letter-spacing:1px;color:#bbb;font-weight:700;margin-bottom:2px}
      .val{font-size:10.5px;font-weight:600;color:#333}
      .items-block{background:#f8f7f4;border-radius:8px;padding:9px 11px;margin-bottom:10px}
      .items-key{font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#aaa;font-weight:700;margin-bottom:5px}
      .item-row{font-size:10.5px;color:#444;padding:3px 0;border-bottom:1px solid #eee}
      .item-row:last-child{border-bottom:none}
      .bar{background:#f0efec;border-top:1px solid #eee;padding:7px 12px;font-size:8px;color:#aaa;text-transform:uppercase;letter-spacing:1px;display:flex;justify-content:space-between}
    </style></head><body>
    <div class="card">
      <div class="strip"></div>
      <div class="inner">
        <div class="org">GatePass — Gate Pass</div>
        <div class="title">${g.purpose}</div>
        <div class="pill">${g.type}</div>
        <div class="id-block">
          <div class="id-label">Pass ID</div>
          <div class="id-val">${g.passId}</div>
        </div>
        <div class="grid">
          ${details.slice(0, 6).map(([k, v]) => `<div class="cell"><div class="key">${k}</div><div class="val">${v}</div></div>`).join("")}
        </div>
        <div class="items-block">
          <div class="items-key">Items / Materials</div>
          ${(g.items ?? []).map(it => `<div class="item-row">${it.name} — ${it.qty} ${it.unit}</div>`).join("")}
        </div>
      </div>
      <div class="bar"><span>${officeShort}</span><span>${fmtDate(new Date().toISOString())}</span></div>
    </div>
    </body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <Dialog open={!!g} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-[560px] max-h-[93vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-semibold text-[19px] tracking-tight font-mono">{g.passId}</DialogTitle>
          <p className="text-[12.5px] text-muted-foreground">{g.type}</p>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <div className="flex gap-1.5">
            <StatusBadge status={g.status} />
            <GPTypeBadge type={g.type} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {details.map(([k, val]) => (
              <div key={k} className="bg-secondary rounded-lg px-3 py-2">
                <div className="text-[9.5px] text-muted-foreground uppercase tracking-wide font-bold mb-0.5">{k}</div>
                <div className="text-[12.5px] font-medium text-foreground">{val}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold pb-2 border-b border-border mb-3">
              Items / Materials
            </div>
            {(g.items ?? []).length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground">No items</p>
            ) : (g.items ?? []).map((it, i) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-border last:border-0 text-[12.5px]">
                <span className="font-medium text-foreground">{it.name}</span>
                <span className="text-muted-foreground">{it.qty} {it.unit}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          {g.status === "Open" && (
            <button className="bg-red-600 text-white font-semibold text-[12.5px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-red-700 transition-colors" onClick={() => { onCloseGP(g.id); onClose(); }}>
              Close Pass
            </button>
          )}
          <button className="btn-ghost" onClick={handlePrint}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print Pass
          </button>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
