import { useEffect, useRef, useState } from "react";
import { Switch, Route, Redirect, Router as WouterRouter, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  Show,
  useClerk,
  useUser,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "sonner";

import { queryClient } from "@/lib/queryClient";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { OfficePicker } from "@/components/modals/OfficePicker";
import { RegisterVisitorModal } from "@/components/modals/RegisterVisitorModal";
import { VisitorDetailModal } from "@/components/modals/VisitorDetailModal";
import { BadgeModal } from "@/components/modals/BadgeModal";
import { NewGatePassModal } from "@/components/modals/NewGatePassModal";
import { GpDetailModal } from "@/components/modals/GpDetailModal";
import { Dashboard } from "@/pages/Dashboard";
import { Visitors } from "@/pages/Visitors";
import { ActivityLog } from "@/pages/ActivityLog";
import { VisitorLink } from "@/pages/VisitorLink";
import { GpDashboard } from "@/pages/GpDashboard";
import { GatePasses } from "@/pages/GatePasses";
import { GpActivityLog } from "@/pages/GpActivityLog";
import { RegisterPage } from "@/pages/RegisterPage";
import { LandingPage } from "@/pages/LandingPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { AdminPanel } from "@/pages/AdminPanel";
import { Settings } from "@/pages/Settings";

const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "bottom" as const,
  },
  variables: {
    colorPrimary: "#c06b2c",
    colorForeground: "#2c1f0e",
    colorMutedForeground: "#78604a",
    colorDanger: "#b91c1c",
    colorBackground: "#faf9f5",
    colorInput: "#f0ece4",
    colorInputForeground: "#2c1f0e",
    colorNeutral: "#d6cec4",
    fontFamily: "'Instrument Sans', sans-serif",
    borderRadius: "0.625rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#faf9f5] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-[#e8e0d6]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#2c1f0e] font-serif text-xl font-semibold",
    headerSubtitle: "text-[#78604a] text-sm",
    socialButtonsBlockButtonText: "text-[#2c1f0e] font-medium",
    formFieldLabel: "text-[#2c1f0e] text-sm font-medium",
    footerActionLink: "text-[#c06b2c] font-medium hover:text-[#a05520]",
    footerActionText: "text-[#78604a]",
    dividerText: "text-[#78604a]",
    identityPreviewEditButton: "text-[#c06b2c]",
    formFieldSuccessText: "text-[#1a7a4a]",
    alertText: "text-[#b91c1c]",
    logoBox: "flex justify-center mb-2",
    logoImage: "w-10 h-10",
    socialButtonsBlockButton: "border-[#d6cec4] hover:bg-[#f0ece4]",
    formButtonPrimary: "bg-[#c06b2c] hover:bg-[#a05520] text-white font-semibold",
    formFieldInput: "bg-[#f0ece4] border-[#d6cec4] text-[#2c1f0e]",
    footerAction: "border-t border-[#e8e0d6]",
    dividerLine: "bg-[#d6cec4]",
    alert: "border-[#fecaca]",
    otpCodeFieldInput: "bg-[#f0ece4] border-[#d6cec4] text-[#2c1f0e]",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener]);

  return null;
}

function MainApp() {
  const {
    user, userLoading,
    selectedOffice, setSelectedOffice, offices,
    visitors, logs, gatePasses, gpLogs,
    addVisitor, doCheckIn, doCheckOut, doBreakOut, doBreakReturn,
    addGatePass, doCloseGatePass,
  } = useApp();

  const [officePickerOpen, setOfficePickerOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [badgeId, setBadgeId] = useState<string | null>(null);
  const [newGPOpen, setNewGPOpen] = useState(false);
  const [gpDetailId, setGPDetailId] = useState<string | null>(null);

  const detailVisitor = detailId ? visitors.find((v) => v.id === detailId) ?? null : null;
  const badgeVisitor = badgeId ? visitors.find((v) => v.id === badgeId) ?? null : null;
  const gpDetail = gpDetailId ? gatePasses.find((g) => g.id === gpDetailId) ?? null : null;

  const officeFull = selectedOffice
    ? `${selectedOffice.name} — ${selectedOffice.city}`
    : "";

  const gpDetailOffice = gpDetail
    ? offices.find((o) => o.id === gpDetail.officeId)
    : selectedOffice;
  const gpDetailOfficeFull = gpDetailOffice
    ? `${gpDetailOffice.name} — ${gpDetailOffice.city}`
    : officeFull;

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading GatePass…</p>
        </div>
      </div>
    );
  }

  // Super admin without a company goes straight to the admin panel
  if (!user?.companyId && user?.role === "super_admin") {
    return (
      <div className="min-h-screen bg-background">
        <AdminPanel superAdminNoCompany />
      </div>
    );
  }

  if (!user?.companyId) {
    return <OnboardingPage user={user} />;
  }

  return (
    <>
      <AppLayout
        office={selectedOffice?.name ?? ""}
        officeFull={officeFull}
        visitors={visitors}
        gatePasses={gatePasses}
        user={user}
        onOpenOfficePicker={() => setOfficePickerOpen(true)}
      >
        <Switch>
          <Route path="/">
            <Dashboard visitors={visitors} logs={logs} officeFull={officeFull} onRegisterVisitor={() => setRegisterOpen(true)} />
          </Route>
          <Route path="/visitors">
            <Visitors
              visitors={visitors}
              officeFull={officeFull}
              onRegister={() => setRegisterOpen(true)}
              onDetail={(id) => setDetailId(id)}
              onCheckIn={doCheckIn}
              onCheckOut={doCheckOut}
              onBreakOut={doBreakOut}
              onBreakReturn={doBreakReturn}
              onOpenBadge={(id) => setBadgeId(id)}
            />
          </Route>
          <Route path="/activity-log">
            <ActivityLog logs={logs} officeFull={officeFull} />
          </Route>
          <Route path="/visitor-link">
            <VisitorLink />
          </Route>
          <Route path="/gp-dashboard">
            <GpDashboard
              gatePasses={gatePasses}
              gpLogs={gpLogs}
              officeFull={officeFull}
              onDetail={(id) => setGPDetailId(id)}
              onNew={() => setNewGPOpen(true)}
            />
          </Route>
          <Route path="/gate-passes">
            <GatePasses
              gatePasses={gatePasses}
              officeFull={officeFull}
              onNew={() => setNewGPOpen(true)}
              onDetail={(id) => setGPDetailId(id)}
              onCloseGP={doCloseGatePass}
            />
          </Route>
          <Route path="/gp-activity-log">
            <GpActivityLog gpLogs={gpLogs} officeFull={officeFull} />
          </Route>
          {user.role === "super_admin" && (
            <Route path="/admin">
              <AdminPanel />
            </Route>
          )}
          <Route path="/settings">
            <Settings />
          </Route>
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </AppLayout>

      <OfficePicker
        open={officePickerOpen}
        offices={offices}
        currentOfficeId={selectedOffice?.id ?? ""}
        onSelect={(id) => {
          const found = offices.find((o) => o.id === id);
          if (found) setSelectedOffice(found);
          setOfficePickerOpen(false);
        }}
        onClose={() => setOfficePickerOpen(false)}
      />

      <RegisterVisitorModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSubmit={async (data) => {
          await addVisitor({
            name: data.name,
            company: data.company ?? undefined,
            email: data.email ?? undefined,
            phone: data.phone ?? undefined,
            type: data.type,
            host: data.hostName ?? "",
            purpose: data.purpose ?? undefined,
            photoUrl: data.photoDataUrl ?? undefined,
            officeId: selectedOffice?.id ?? "",
          });
        }}
      />

      <VisitorDetailModal
        visitor={detailVisitor}
        onClose={() => setDetailId(null)}
        onCheckIn={doCheckIn}
        onCheckOut={doCheckOut}
        onBreakOut={doBreakOut}
        onBreakReturn={doBreakReturn}
        onOpenBadge={(id) => { setDetailId(null); setBadgeId(id); }}
      />

      <BadgeModal
        visitor={badgeVisitor}
        officeFull={badgeVisitor ? (offices.find(o => o.id === badgeVisitor.officeId)
          ? `${offices.find(o => o.id === badgeVisitor.officeId)!.name} — ${offices.find(o => o.id === badgeVisitor.officeId)!.city}`
          : officeFull) : ""}
        onClose={() => setBadgeId(null)}
      />

      <NewGatePassModal
        open={newGPOpen}
        onClose={() => setNewGPOpen(false)}
        onSubmit={async (data) => {
          await addGatePass({
            officeId: selectedOffice?.id ?? "",
            purpose: data.purpose,
            type: data.type,
            requestedBy: data.requestedBy,
            vendorName: data.vendorName ?? undefined,
            vehicleNo: data.vehicleNo ?? undefined,
            driverName: data.driverName ?? undefined,
            notes: data.notes ?? undefined,
            items: data.items.map(it => ({
              name: it.name,
              qty: Number(it.qty) || 1,
              unit: it.unit || "pcs",
            })),
          });
        }}
      />

      <GpDetailModal
        gatePass={gpDetail}
        officeFull={gpDetailOfficeFull}
        onClose={() => setGPDetailId(null)}
        onCloseGP={doCloseGatePass}
      />
    </>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <AppProvider>
          <MainApp />
        </AppProvider>
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: { title: "Welcome back", subtitle: "Sign in to GatePass" },
        },
        signUp: {
          start: { title: "Create your account", subtitle: "Start managing visitors today" },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkQueryClientCacheInvalidator />
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/register" component={RegisterPage} />
        <Route>
          <Show when="signed-in">
            <AppProvider>
              <MainApp />
            </AppProvider>
          </Show>
          <Show when="signed-out">
            <Redirect to="/" />
          </Show>
        </Route>
      </Switch>
    </ClerkProvider>
  );
}

function App() {
  return (
    <BrandingProvider>
      <WouterRouter base={basePath}>
        <QueryClientProvider client={queryClient}>
          <ClerkProviderWithRoutes />
        </QueryClientProvider>
        <Toaster position="top-right" richColors />
      </WouterRouter>
    </BrandingProvider>
  );
}

export default App;
