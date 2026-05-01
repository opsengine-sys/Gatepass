import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "sonner";

import { useAppState } from "@/hooks/useAppState";
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

function MainApp() {
  const { state, setOffice, addVisitor, checkIn, checkOut, breakOut, breakReturn, addGatePass, closeGatePass } = useAppState();

  const [officePickerOpen, setOfficePickerOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [badgeId, setBadgeId] = useState<string | null>(null);
  const [newGPOpen, setNewGPOpen] = useState(false);
  const [gpDetailId, setGPDetailId] = useState<string | null>(null);

  const detailVisitor = detailId ? state.visitors.find(v => v.id === detailId) ?? null : null;
  const badgeVisitor = badgeId ? state.visitors.find(v => v.id === badgeId) ?? null : null;
  const gpDetail = gpDetailId ? state.gatePasses.find(g => g.id === gpDetailId) ?? null : null;

  const commonVisitorProps = {
    onCheckIn: checkIn,
    onCheckOut: checkOut,
    onBreakOut: breakOut,
    onBreakReturn: breakReturn,
    onDetail: (id: string) => setDetailId(id),
    onOpenBadge: (id: string) => setBadgeId(id),
  };

  return (
    <>
      <AppLayout
        office={state.office}
        visitors={state.visitors}
        gatePasses={state.gatePasses}
        onOpenOfficePicker={() => setOfficePickerOpen(true)}
      >
        <Switch>
          <Route path="/">
            <Dashboard visitors={state.visitors} logs={state.logs} office={state.office} />
          </Route>
          <Route path="/visitors">
            <Visitors
              visitors={state.visitors}
              office={state.office}
              onRegister={() => setRegisterOpen(true)}
              {...commonVisitorProps}
            />
          </Route>
          <Route path="/activity-log">
            <ActivityLog logs={state.logs} visitors={state.visitors} office={state.office} />
          </Route>
          <Route path="/visitor-link">
            <VisitorLink />
          </Route>
          <Route path="/gp-dashboard">
            <GpDashboard
              gatePasses={state.gatePasses}
              gpLogs={state.gpLogs}
              office={state.office}
              onDetail={(id) => setGPDetailId(id)}
            />
          </Route>
          <Route path="/gate-passes">
            <GatePasses
              gatePasses={state.gatePasses}
              office={state.office}
              onNew={() => setNewGPOpen(true)}
              onDetail={(id) => setGPDetailId(id)}
              onClose_GP={closeGatePass}
            />
          </Route>
          <Route path="/gp-activity-log">
            <GpActivityLog gpLogs={state.gpLogs} office={state.office} />
          </Route>
          <Route>
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p className="text-[14px] font-medium">Page not found</p>
            </div>
          </Route>
        </Switch>
      </AppLayout>

      <OfficePicker
        open={officePickerOpen}
        currentOffice={state.office}
        onSelect={setOffice}
        onClose={() => setOfficePickerOpen(false)}
      />
      <RegisterVisitorModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSubmit={addVisitor}
        currentOffice={state.office}
      />
      <VisitorDetailModal
        visitor={detailVisitor}
        onClose={() => setDetailId(null)}
        onCheckIn={checkIn}
        onCheckOut={checkOut}
        onBreakOut={breakOut}
        onBreakReturn={breakReturn}
        onOpenBadge={(id) => { setDetailId(null); setBadgeId(id); }}
      />
      <BadgeModal
        visitor={badgeVisitor}
        onClose={() => setBadgeId(null)}
      />
      <NewGatePassModal
        open={newGPOpen}
        onClose={() => setNewGPOpen(false)}
        onSubmit={addGatePass}
        currentOffice={state.office}
      />
      <GpDetailModal
        gatePass={gpDetail}
        onClose={() => setGPDetailId(null)}
        onClose_GP={closeGatePass}
      />
    </>
  );
}

function App() {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  return (
    <WouterRouter base={base}>
      <Switch>
        <Route path="/register" component={RegisterPage} />
        <Route>
          <MainApp />
        </Route>
      </Switch>
      <Toaster position="top-right" richColors />
    </WouterRouter>
  );
}

export default App;
