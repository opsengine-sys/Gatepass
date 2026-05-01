import { useLocation } from "wouter";

export function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
              <rect x="3" y="4" width="14" height="10" rx="2"/>
              <path d="M7 8h6M7 11h4"/>
              <rect x="7" y="17" width="10" height="3" rx="1.5"/>
            </svg>
          </div>
          <div>
            <div className="font-serif font-semibold text-[15px] text-foreground">GatePass</div>
            <div className="text-[10px] text-muted-foreground leading-none">Visitor & Pass Management</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLocation("/sign-in")} className="text-[13px] font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors">
            Sign In
          </button>
          <button onClick={() => setLocation("/sign-up")} className="btn-primary text-[13px]">
            Get Started
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-primary border border-orange-200 rounded-full px-3.5 py-1.5 text-[12px] font-semibold mb-6">
          <span className="w-1.5 h-1.5 bg-primary rounded-full" />
          Enterprise Visitor Management
        </div>

        <h1 className="font-serif text-[40px] md:text-[52px] font-semibold text-foreground leading-tight mb-5 max-w-2xl">
          Manage Visitors &amp; Gate Passes
          <br />
          <span className="text-primary">Across All Your Offices</span>
        </h1>

        <p className="text-[16px] text-muted-foreground max-w-xl mb-10 leading-relaxed">
          A full-scale SaaS platform for Indian corporate offices to manage visitor check-ins, physical gate passes, and security operations — all in one place.
        </p>

        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/sign-up")} className="btn-primary px-6 py-2.5 text-[14px]">
            Start Free Trial
          </button>
          <button onClick={() => setLocation("/sign-in")} className="btn-ghost px-6 py-2.5 text-[14px]">
            Sign In
          </button>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl w-full">
          {[
            { icon: "👥", label: "Visitor Check-in", desc: "Register & track visitors in real-time" },
            { icon: "🎫", label: "Gate Passes", desc: "Issue & manage physical gate passes" },
            { icon: "🏢", label: "Multi-Office", desc: "Manage all locations from one dashboard" },
            { icon: "🔐", label: "Role-based Access", desc: "Admin, security, and viewer roles" },
          ].map((f) => (
            <div key={f.label} className="bg-card border border-border rounded-xl p-4 text-left">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-[13px] font-semibold text-foreground mb-1">{f.label}</div>
              <div className="text-[11.5px] text-muted-foreground leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-border text-center text-[12px] text-muted-foreground">
        © {new Date().getFullYear()} GatePass — Visitor &amp; Gate Pass Management
      </footer>
    </div>
  );
}
