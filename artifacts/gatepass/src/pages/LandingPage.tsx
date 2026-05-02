import { useLocation } from "wouter";
import { useState } from "react";

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "Visitor Management",
    desc: "Register, photograph, and track every visitor in real-time. Automatic check-in/out, host notifications, and visitor badges.",
    badge: "Core",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    title: "Gate Pass System",
    desc: "Issue digital gate passes for materials, equipment, and vehicles. Track items in and out with full audit trails.",
    badge: "Core",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      </svg>
    ),
    title: "Multi-Office",
    desc: "Manage all your office locations from a single dashboard. Each office has its own visitor log, passes, and security team.",
    badge: "Growth",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: "Role-Based Access",
    desc: "Assign admin, security, and viewer roles per office. Full control over who can do what, with a complete audit trail.",
    badge: "Core",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: "Activity Logs",
    desc: "Every check-in, check-out, break, and gate pass action is logged with timestamps. Ideal for compliance and audits.",
    badge: "Core",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
    title: "Visitor Self-Registration",
    desc: "Share a QR code or link so visitors can pre-register before arrival. Reduces lobby wait times and improves experience.",
    badge: "Growth",
  },
];

const steps = [
  {
    num: "01",
    title: "Set up your company",
    desc: "Sign up, create your company profile, and add your office locations. Takes under 5 minutes.",
  },
  {
    num: "02",
    title: "Invite your team",
    desc: "Add security staff and office admins. Assign roles — each person sees only what they need.",
  },
  {
    num: "03",
    title: "Start managing visitors",
    desc: "Register walk-ins, issue gate passes, track everything in real-time from any device.",
  },
];

const plans = [
  {
    name: "Starter",
    tagline: "Perfect for a single office",
    price: "₹2,999",
    period: "/month",
    highlight: false,
    features: [
      "1 office location",
      "Up to 500 visitors/month",
      "Visitor Management",
      "Gate Pass System",
      "Activity Logs",
      "3 user accounts",
      "Email support",
    ],
    cta: "Start Free Trial",
    ctaVariant: "ghost",
  },
  {
    name: "Growth",
    tagline: "For growing organisations",
    price: "₹7,999",
    period: "/month",
    highlight: true,
    features: [
      "Up to 5 office locations",
      "Unlimited visitors",
      "Everything in Starter",
      "Multi-Office Dashboard",
      "Visitor Self-Registration",
      "20 user accounts",
      "Priority support",
    ],
    cta: "Start Free Trial",
    ctaVariant: "primary",
  },
  {
    name: "Enterprise",
    tagline: "For large, complex deployments",
    price: "Custom",
    period: "",
    highlight: false,
    features: [
      "Unlimited offices",
      "Unlimited visitors",
      "Everything in Growth",
      "Analytics & Reports",
      "API Access",
      "Unlimited users",
      "Dedicated account manager",
      "Custom onboarding & SLA",
    ],
    cta: "Contact Sales",
    ctaVariant: "ghost",
  },
];

const badgeColors: Record<string, string> = {
  Core: "bg-orange-50 text-orange-700 border-orange-200",
  Growth: "bg-blue-50 text-blue-700 border-blue-200",
};

export function LandingPage() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                <rect x="3" y="4" width="14" height="10" rx="2"/>
                <path d="M7 8h6M7 11h4"/>
                <rect x="7" y="17" width="10" height="3" rx="1.5"/>
              </svg>
            </div>
            <div>
              <div className="font-serif font-semibold text-[15px]">GatePass</div>
              <div className="text-[9.5px] text-muted-foreground leading-none">Visitor & Pass Management</div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {["Features", "How it Works", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocation("/sign-in")}
              className="hidden md:block text-[13px] font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => setLocation("/sign-up")}
              className="btn-primary text-[13px]"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="pt-20 pb-24 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-orange-50 text-primary border border-orange-200 rounded-full px-3.5 py-1.5 text-[12px] font-semibold mb-6">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Built for Indian Corporate Offices
            </div>

            <h1 className="font-serif text-[42px] md:text-[58px] font-semibold leading-[1.12] mb-6">
              Manage Visitors &amp; Gate Passes
              <br />
              <span className="text-primary">Across All Your Offices</span>
            </h1>

            <p className="text-[17px] text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              A complete SaaS platform for corporate offices to handle visitor check-ins, physical gate passes, and security operations — all in one place.
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => setLocation("/sign-up")}
                className="btn-primary px-7 py-3 text-[14px] font-semibold"
              >
                Start Free Trial — 14 days
              </button>
              <button
                onClick={() => setLocation("/sign-in")}
                className="btn-ghost px-7 py-3 text-[14px]"
              >
                Sign In
              </button>
            </div>

            <p className="text-[12px] text-muted-foreground mt-4">No credit card required · Set up in 5 minutes</p>
          </div>

          {/* Hero stats */}
          <div className="mt-16 max-w-2xl mx-auto grid grid-cols-3 gap-6">
            {[
              { num: "10,000+", label: "Visitors tracked" },
              { num: "50+", label: "Companies onboarded" },
              { num: "99.9%", label: "Uptime SLA" },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-xl py-5">
                <div className="font-serif text-[26px] font-bold text-primary">{s.num}</div>
                <div className="text-[12px] text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────────────── */}
        <section id="features" className="py-20 px-6 bg-secondary/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <div className="text-[12px] font-bold text-primary uppercase tracking-wider mb-3">Features</div>
              <h2 className="font-serif text-[32px] md:text-[38px] font-semibold text-foreground">
                Everything you need to secure your premises
              </h2>
              <p className="text-[15px] text-muted-foreground mt-4 max-w-lg mx-auto">
                From single-office startups to multi-location enterprises, GatePass scales with you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f) => (
                <div key={f.title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center text-primary">
                      {f.icon}
                    </div>
                    <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${badgeColors[f.badge]}`}>
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[15px] text-foreground mb-2">{f.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <div className="text-[12px] font-bold text-primary uppercase tracking-wider mb-3">How it Works</div>
              <h2 className="font-serif text-[32px] md:text-[38px] font-semibold text-foreground">
                Up and running in minutes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((s, i) => (
                <div key={s.num} className="relative">
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] right-[-calc(50%-40px)] h-px border-t-2 border-dashed border-border" />
                  )}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 border-2 border-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <span className="font-serif text-[20px] font-bold text-primary">{s.num}</span>
                    </div>
                    <h3 className="font-semibold text-[15px] text-foreground mb-2">{s.title}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────────────── */}
        <section id="pricing" className="py-20 px-6 bg-secondary/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <div className="text-[12px] font-bold text-primary uppercase tracking-wider mb-3">Pricing</div>
              <h2 className="font-serif text-[32px] md:text-[38px] font-semibold text-foreground">
                Simple, transparent pricing
              </h2>
              <p className="text-[15px] text-muted-foreground mt-4">
                All plans include a 14-day free trial. No credit card required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {plans.map((p) => (
                <div
                  key={p.name}
                  className={`relative bg-card border rounded-2xl p-7 flex flex-col transition-shadow hover:shadow-lg ${
                    p.highlight ? "border-primary shadow-lg" : "border-border"
                  }`}
                >
                  {p.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-white text-[11px] font-bold px-3 py-1 rounded-full">Most Popular</span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="font-serif text-[20px] font-semibold text-foreground">{p.name}</div>
                    <div className="text-[13px] text-muted-foreground mt-1">{p.tagline}</div>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-serif text-[36px] font-bold text-foreground">{p.price}</span>
                      {p.period && <span className="text-[14px] text-muted-foreground">{p.period}</span>}
                    </div>
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-7">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px] text-foreground">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-primary flex-shrink-0 mt-0.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => setLocation(p.cta === "Contact Sales" ? "/sign-in" : "/sign-up")}
                    className={p.ctaVariant === "primary" ? "btn-primary w-full justify-center" : "btn-ghost w-full justify-center"}
                  >
                    {p.cta}
                  </button>
                </div>
              ))}
            </div>

            <p className="text-center text-[12.5px] text-muted-foreground mt-8">
              Pricing is subject to change. Contact us for volume discounts, annual billing, or custom enterprise contracts.
            </p>
          </div>
        </section>

        {/* ── CTA Banner ────────────────────────────────────────────────────── */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto bg-primary rounded-3xl px-8 py-14 text-center text-white">
            <h2 className="font-serif text-[28px] md:text-[34px] font-semibold mb-4 leading-tight">
              Ready to modernise your visitor management?
            </h2>
            <p className="text-[15px] text-white/80 mb-8 max-w-lg mx-auto leading-relaxed">
              Join companies across India using GatePass to secure their offices and simplify gate operations.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => setLocation("/sign-up")}
                className="bg-white text-primary font-semibold px-7 py-3 rounded-xl text-[14px] hover:bg-white/90 transition-colors"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => setLocation("/sign-in")}
                className="border border-white/40 text-white font-medium px-7 py-3 rounded-xl text-[14px] hover:bg-white/10 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-3.5 h-3.5">
                    <rect x="3" y="4" width="14" height="10" rx="2"/>
                    <path d="M7 8h6M7 11h4"/>
                    <rect x="7" y="17" width="10" height="3" rx="1.5"/>
                  </svg>
                </div>
                <span className="font-serif font-semibold text-[14px]">GatePass</span>
              </div>
              <p className="text-[12.5px] text-muted-foreground max-w-xs leading-relaxed">
                Visitor & gate pass management for Indian corporate offices. Secure. Simple. Scalable.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-[13px]">
              <div>
                <div className="font-semibold text-foreground mb-3">Product</div>
                <ul className="space-y-2 text-muted-foreground">
                  {["Features", "Pricing", "How it Works"].map((l) => (
                    <li key={l}><a href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="hover:text-foreground transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-semibold text-foreground mb-3">Account</div>
                <ul className="space-y-2 text-muted-foreground">
                  <li><button onClick={() => setLocation("/sign-in")} className="hover:text-foreground transition-colors">Sign In</button></li>
                  <li><button onClick={() => setLocation("/sign-up")} className="hover:text-foreground transition-colors">Create Account</button></li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-foreground mb-3">Contact</div>
                <ul className="space-y-2 text-muted-foreground">
                  <li>support@gatepass.in</li>
                  <li>+91 98765 00000</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-muted-foreground">
            <span>© {new Date().getFullYear()} GatePass Technologies Pvt. Ltd. All rights reserved.</span>
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
