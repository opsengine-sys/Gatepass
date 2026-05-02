import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { HeroShader } from "@/components/HeroShader";

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "Visitor Management",
    desc: "Register, photograph, and track every visitor. Real-time check-in/out with host notifications.",
    badge: "Core",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    title: "Gate Pass System",
    desc: "Issue digital passes for materials, equipment, and vehicles with full audit trails.",
    badge: "Core",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      </svg>
    ),
    title: "Multi-Office",
    desc: "Manage all your locations from one dashboard. Each office has its own log and security team.",
    badge: "Growth",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: "Role-Based Access",
    desc: "Admin, security, and viewer roles per office. Full audit trail of every action.",
    badge: "Core",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: "Activity Logs",
    desc: "Every check-in, gate pass, and action logged with timestamps. Compliance-ready.",
    badge: "Core",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z"/>
      </svg>
    ),
    title: "Custom Badge Designer",
    desc: "Design visitor badges & gate passes from scratch. Full layout editor with live preview.",
    badge: "Growth",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

const steps = [
  { num: "01", title: "Set up your workspace", desc: "Sign up, create your company profile, and add offices. Under 5 minutes." },
  { num: "02", title: "Invite your team", desc: "Add security staff and admins. Each person sees only what they need." },
  { num: "03", title: "Start managing visitors", desc: "Register walk-ins, issue gate passes, track everything in real-time." },
];

const plans = [
  {
    name: "Starter",
    tagline: "Perfect for a single office",
    price: "₹2,999",
    period: "/month",
    highlight: false,
    features: ["1 office location", "500 visitors/month", "Visitor Management", "Gate Pass System", "Activity Logs", "3 user accounts", "Email support"],
    cta: "Start Free Trial",
    ctaVariant: "ghost",
  },
  {
    name: "Growth",
    tagline: "For growing organisations",
    price: "₹7,999",
    period: "/month",
    highlight: true,
    features: ["Up to 5 offices", "Unlimited visitors", "Everything in Starter", "Multi-Office Dashboard", "Custom Badge Designer", "20 user accounts", "Priority support"],
    cta: "Start Free Trial",
    ctaVariant: "primary",
  },
  {
    name: "Enterprise",
    tagline: "Large, complex deployments",
    price: "Custom",
    period: "",
    highlight: false,
    features: ["Unlimited offices", "Unlimited visitors", "Everything in Growth", "Analytics & Reports", "API Access", "Unlimited users", "Dedicated account manager"],
    cta: "Contact Sales",
    ctaVariant: "ghost",
  },
];

const stats = [
  { num: "10,000+", label: "Visitors tracked" },
  { num: "50+", label: "Companies onboarded" },
  { num: "99.9%", label: "Uptime SLA" },
];

const badgeBg: Record<string, string> = {
  Core: "bg-zinc-100 text-zinc-600",
  Growth: "bg-blue-50 text-blue-600",
};

function HeroBg() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>

      {/* ① CSS base — visible immediately, no JS required */}
      {/* Large warm-orange ellipse top-left */}
      <div className="absolute" style={{
        top: "-10%", left: "-5%",
        width: "70%", height: "80%",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(192,107,44,0.22) 0%, transparent 70%)",
        filter: "blur(48px)",
      }} />
      {/* Mid amber blob top-right */}
      <div className="absolute" style={{
        top: "-15%", right: "-8%",
        width: "55%", height: "75%",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(217,143,60,0.18) 0%, transparent 68%)",
        filter: "blur(56px)",
      }} />
      {/* Soft peach centre glow */}
      <div className="absolute" style={{
        top: "10%", left: "25%",
        width: "50%", height: "60%",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(251,191,114,0.15) 0%, transparent 65%)",
        filter: "blur(40px)",
      }} />
      {/* Warm lower-left accent */}
      <div className="absolute" style={{
        bottom: "5%", left: "5%",
        width: "35%", height: "45%",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(192,107,44,0.10) 0%, transparent 70%)",
        filter: "blur(36px)",
      }} />

      {/* ② Dot grid for texture */}
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle, rgba(192,107,44,0.14) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 75%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 75%, transparent 100%)",
      }} />

      {/* ③ WebGL animated layer (adds organic motion on top of CSS) */}
      <HeroShader className="absolute inset-0 w-full h-full" />

      {/* ④ Bottom fade — blend back to page background */}
      <div className="absolute inset-x-0 bottom-0 h-32" style={{
        background: "linear-gradient(to bottom, transparent, hsl(var(--background)))",
      }} />
    </div>
  );
}

export function LandingPage() {
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── Sticky Header ──────────────────────────────────────── */}
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-200",
        scrolled ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"
      )}>
        <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                <rect x="3" y="4" width="14" height="10" rx="2"/>
                <path d="M7 8h6M7 11h4"/>
                <rect x="7" y="17" width="10" height="3" rx="1.5"/>
              </svg>
            </div>
            <span className="font-bold text-[15px] tracking-tight text-foreground">GatePass</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {["Features", "How it Works", "Pricing"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-secondary transition-all">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => setLocation("/sign-in")}
              className="hidden md:block text-[13px] font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-secondary transition-all">
              Sign In
            </button>
            <button onClick={() => setLocation("/sign-up")}
              className="flex items-center gap-1.5 text-[13px] font-semibold bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary/90 active:scale-[.98] transition-all shadow-sm">
              Get Started
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>

            <button className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors" onClick={() => setMobileOpen(p => !p)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                {mobileOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background/98 px-6 py-3 space-y-1">
            {["Features", "How it Works", "Pricing"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setMobileOpen(false)}
                className="block text-[14px] font-medium text-foreground py-2.5 px-3 rounded-lg hover:bg-secondary">
                {item}
              </a>
            ))}
            <div className="pt-1 border-t border-border flex gap-2">
              <button onClick={() => setLocation("/sign-in")} className="flex-1 text-[13px] font-medium border border-border text-foreground py-2 rounded-lg hover:bg-secondary transition-all">Sign In</button>
              <button onClick={() => setLocation("/sign-up")} className="flex-1 text-[13px] font-semibold bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-all">Get Started</button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative pt-28 pb-24 px-6 overflow-hidden">
          <HeroBg />
          <div className="max-w-4xl mx-auto text-center relative z-10">

            <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 text-primary rounded-full px-3.5 py-1.5 text-[12px] font-semibold mb-8">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Built for Indian Corporate Offices
            </div>

            <h1 className="text-[40px] md:text-[60px] font-bold leading-[1.08] tracking-tight mb-6 text-foreground">
              Visitor & Gate Pass<br/>
              <span className="text-primary">Management, Simplified</span>
            </h1>

            <p className="text-[17px] text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              A complete SaaS platform for corporate offices — visitor check-ins, physical gate passes, badge printing, and security operations in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => setLocation("/sign-up")}
                className="flex items-center gap-2 text-[14px] font-semibold bg-primary text-white px-7 py-3 rounded-xl hover:bg-primary/90 active:scale-[.98] transition-all shadow-md">
                Start Free Trial — 14 days
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
              <button onClick={() => setLocation("/sign-in")}
                className="flex items-center gap-2 text-[14px] font-medium text-foreground border border-border px-7 py-3 rounded-xl hover:bg-secondary active:scale-[.98] transition-all">
                Sign In
              </button>
            </div>

            <p className="text-[12px] text-muted-foreground mt-4">No credit card required · Set up in 5 minutes</p>

            {/* Stats row */}
            <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {stats.map(s => (
                <div key={s.label} className="bg-card border border-border rounded-2xl py-5 px-2 shadow-sm">
                  <div className="text-[26px] font-bold text-primary leading-none">{s.num}</div>
                  <div className="text-[11.5px] text-muted-foreground mt-1.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────── */}
        <section id="features" className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <div className="text-[11px] font-bold text-primary uppercase tracking-[0.12em] mb-3">Features</div>
              <h2 className="text-[32px] md:text-[38px] font-bold tracking-tight text-foreground">
                Everything to secure your premises
              </h2>
              <p className="text-[15px] text-muted-foreground mt-4 max-w-lg mx-auto leading-relaxed">
                From single-office startups to multi-location enterprises, GatePass scales with you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map(f => (
                <div key={f.title}
                  className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-default">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", f.bg, f.color)}>
                      {f.icon}
                    </div>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", badgeBg[f.badge])}>{f.badge}</span>
                  </div>
                  <h3 className="font-semibold text-[14.5px] text-foreground mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────── */}
        <section id="how-it-works" className="py-20 px-6 bg-secondary/20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <div className="text-[11px] font-bold text-primary uppercase tracking-[0.12em] mb-3">How it Works</div>
              <h2 className="text-[32px] md:text-[38px] font-bold tracking-tight text-foreground">
                Up and running in minutes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((s, i) => (
                <div key={s.num} className="relative bg-card border border-border rounded-2xl p-7 text-center hover:shadow-md transition-shadow">
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 text-muted-foreground/30 text-xl font-thin z-10">›</div>
                  )}
                  <div className="w-12 h-12 bg-primary/8 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <span className="text-[17px] font-bold text-primary">{s.num}</span>
                  </div>
                  <h3 className="font-semibold text-[15px] text-foreground mb-2 tracking-tight">{s.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────── */}
        <section id="pricing" className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <div className="text-[11px] font-bold text-primary uppercase tracking-[0.12em] mb-3">Pricing</div>
              <h2 className="text-[32px] md:text-[38px] font-bold tracking-tight text-foreground">
                Simple, transparent pricing
              </h2>
              <p className="text-[15px] text-muted-foreground mt-4">
                All plans include a 14-day free trial. No credit card required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {plans.map(p => (
                <div key={p.name} className={cn(
                  "relative bg-card border rounded-2xl p-7 flex flex-col transition-all hover:shadow-lg",
                  p.highlight ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_8px_32px_hsl(var(--primary)/0.12)]" : "border-border"
                )}>
                  {p.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-white text-[11px] font-bold px-3.5 py-1 rounded-full shadow-sm">Most Popular</span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="text-[19px] font-bold text-foreground tracking-tight">{p.name}</div>
                    <div className="text-[13px] text-muted-foreground mt-0.5">{p.tagline}</div>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-[36px] font-bold text-foreground leading-none tracking-tight">{p.price}</span>
                      {p.period && <span className="text-[14px] text-muted-foreground">{p.period}</span>}
                    </div>
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-7">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px] text-foreground">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-primary flex-shrink-0 mt-0.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button onClick={() => setLocation(p.cta === "Contact Sales" ? "/sign-in" : "/sign-up")}
                    className={cn(
                      "w-full py-2.5 rounded-xl text-[13.5px] font-semibold transition-all active:scale-[.98]",
                      p.ctaVariant === "primary"
                        ? "bg-primary text-white hover:bg-primary/90 shadow-sm"
                        : "border border-border text-foreground hover:bg-secondary"
                    )}>
                    {p.cta}
                  </button>
                </div>
              ))}
            </div>

            <p className="text-center text-[12px] text-muted-foreground mt-6">
              Contact us for volume discounts, annual billing, or custom enterprise contracts.
            </p>
          </div>
        </section>

        {/* ── CTA Banner ────────────────────────────────────────── */}
        <section className="py-20 px-6 bg-secondary/20">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-primary rounded-3xl px-8 py-14 text-center text-white overflow-hidden">
              <div className="absolute inset-0 pointer-events-none" aria-hidden>
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-black/10" />
              </div>
              <div className="relative z-10">
                <h2 className="text-[26px] md:text-[32px] font-bold mb-4 leading-tight tracking-tight">
                  Ready to modernise your<br/>visitor management?
                </h2>
                <p className="text-[15px] text-white/75 mb-8 max-w-md mx-auto leading-relaxed">
                  Join companies across India using GatePass to secure their offices and simplify gate operations.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button onClick={() => setLocation("/sign-up")}
                    className="bg-white text-primary font-semibold px-7 py-3 rounded-xl text-[14px] hover:bg-white/90 active:scale-[.98] transition-all shadow-sm">
                    Start Free Trial
                  </button>
                  <button onClick={() => setLocation("/sign-in")}
                    className="border border-white/30 text-white font-medium px-7 py-3 rounded-xl text-[14px] hover:bg-white/10 active:scale-[.98] transition-all">
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="max-w-[240px]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-3.5 h-3.5">
                    <rect x="3" y="4" width="14" height="10" rx="2"/>
                    <path d="M7 8h6M7 11h4"/>
                    <rect x="7" y="17" width="10" height="3" rx="1.5"/>
                  </svg>
                </div>
                <span className="font-bold text-[14px] tracking-tight text-foreground">GatePass</span>
              </div>
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                Visitor & gate pass management for Indian corporate offices. Secure. Simple. Scalable.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-[13px]">
              <div>
                <div className="font-semibold text-foreground mb-3 text-[13px] tracking-tight">Product</div>
                <ul className="space-y-2 text-muted-foreground">
                  {["Features", "Pricing", "How it Works"].map(l => (
                    <li key={l}><a href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="hover:text-foreground transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-semibold text-foreground mb-3 text-[13px] tracking-tight">Account</div>
                <ul className="space-y-2 text-muted-foreground">
                  <li><button onClick={() => setLocation("/sign-in")} className="hover:text-foreground transition-colors">Sign In</button></li>
                  <li><button onClick={() => setLocation("/sign-up")} className="hover:text-foreground transition-colors">Create Account</button></li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-foreground mb-3 text-[13px] tracking-tight">Contact</div>
                <ul className="space-y-2 text-muted-foreground text-[12.5px]">
                  <li>support@gatepass.in</li>
                  <li>+91 98765 00000</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-muted-foreground">
            <span>© {new Date().getFullYear()} GatePass Technologies Pvt. Ltd.</span>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
