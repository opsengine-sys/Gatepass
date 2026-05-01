import { useState } from "react";
import { toast } from "sonner";

export function VisitorLink() {
  const [copied, setCopied] = useState(false);

  const registrationUrl = `${window.location.origin}${import.meta.env.BASE_URL}register`;

  const copy = () => {
    navigator.clipboard.writeText(registrationUrl).then(() => {
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const whatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Please register before your visit using this link:\n${registrationUrl}`)}`);
  };

  const email = () => {
    window.open(`mailto:?subject=Visitor Registration&body=${encodeURIComponent(`Please register before your visit:\n${registrationUrl}`)}`);
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-serif text-[21px] font-medium text-foreground">Visitor Registration Link</h1>
        <p className="text-[12.5px] text-muted-foreground mt-0.5">Share this link with visitors to let them pre-register</p>
      </div>

      <div className="max-w-[600px] space-y-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Registration URL</div>
          <div className="bg-secondary border border-border rounded-lg px-4 py-3 font-mono text-[12.5px] text-foreground break-all">
            {registrationUrl}
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn-primary" onClick={copy}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button className="btn-ghost" onClick={whatsapp}>WhatsApp</button>
            <button className="btn-ghost" onClick={email}>Email</button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">How It Works</div>
          <div className="space-y-3">
            {[
              ["1", "Share the link", "Send the registration link to visitors before their arrival."],
              ["2", "Visitor fills form", "Visitors enter their details on the public form — no account needed."],
              ["3", "You receive entry", "Submitted registrations appear in the Visitors list with 'Pending' status."],
              ["4", "Check them in", "On arrival, find the visitor and click Check In to issue their Visitor ID."],
            ].map(([num, title, desc]) => (
              <div key={num} className="flex gap-3.5">
                <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                  {num}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-foreground">{title}</div>
                  <div className="text-[12px] text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>; }
