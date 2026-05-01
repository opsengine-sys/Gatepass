import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMe,
  useListOffices,
  useListVisitors,
  useListVisitorLogs,
  useListGatePasses,
  useListGpLogs,
  checkInVisitor,
  checkOutVisitor,
  visitorBreak,
  visitorReturn,
  registerVisitor,
  createGatePass,
  closeGatePass,
} from "@workspace/api-client-react";
import { toast } from "sonner";
import type { UserProfile, Office, Visitor, GatePass, VisitorLog, GPLog } from "@/types";

function qo(opts: Record<string, unknown>) {
  return { query: opts } as never;
}

interface AppContextValue {
  user: UserProfile | null;
  userLoading: boolean;

  offices: Office[];
  selectedOffice: Office | null;
  setSelectedOffice: (office: Office) => void;

  visitors: Visitor[];
  visitorsLoading: boolean;

  logs: VisitorLog[];
  logsLoading: boolean;

  gatePasses: GatePass[];
  gatePassesLoading: boolean;

  gpLogs: GPLog[];
  gpLogsLoading: boolean;

  addVisitor: (data: Parameters<typeof registerVisitor>[0]) => Promise<Visitor>;
  doCheckIn: (id: string) => Promise<void>;
  doCheckOut: (id: string) => Promise<void>;
  doBreakOut: (id: string) => Promise<void>;
  doBreakReturn: (id: string) => Promise<void>;
  addGatePass: (data: Parameters<typeof createGatePass>[0]) => Promise<GatePass>;
  doCloseGatePass: (id: string) => Promise<void>;

  refetchAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);

  const { data: rawUser, isLoading: userLoading } = useGetMe(
    qo({ retry: false }),
  );

  const user = (rawUser as UserProfile) ?? null;

  const { data: rawOffices = [] } = useListOffices(
    qo({ enabled: !!user?.companyId }),
  );

  const offices = rawOffices as Office[];

  useEffect(() => {
    if (!selectedOffice && offices.length > 0) {
      const preferred = user?.officeId
        ? offices.find((o) => o.id === user.officeId) ?? offices[0]
        : offices[0];
      setSelectedOffice(preferred);
    }
  }, [offices, user?.officeId]);

  const officeId = selectedOffice?.id ?? "";

  const { data: rawVisitors = [], isLoading: visitorsLoading } = useListVisitors(
    { officeId },
    qo({ enabled: !!officeId, refetchInterval: 30_000 }),
  );

  const { data: rawLogs = [], isLoading: logsLoading } = useListVisitorLogs(
    { officeId },
    qo({ enabled: !!officeId }),
  );

  const { data: rawGatePasses = [], isLoading: gatePassesLoading } = useListGatePasses(
    { officeId },
    qo({ enabled: !!officeId }),
  );

  const { data: rawGpLogs = [], isLoading: gpLogsLoading } = useListGpLogs(
    { officeId },
    qo({ enabled: !!officeId }),
  );

  const visitors = rawVisitors as Visitor[];
  const logs = rawLogs as VisitorLog[];
  const gatePasses = rawGatePasses as GatePass[];
  const gpLogs = rawGpLogs as unknown as GPLog[];

  const invalidateAll = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["/api/visitors"] });
    qc.invalidateQueries({ queryKey: ["/api/visitor-logs"] });
    qc.invalidateQueries({ queryKey: ["/api/gate-passes"] });
    qc.invalidateQueries({ queryKey: ["/api/gp-logs"] });
  }, [qc]);

  const addVisitor = useCallback(
    async (data: Parameters<typeof registerVisitor>[0]) => {
      const result = await registerVisitor(data);
      qc.invalidateQueries({ queryKey: ["/api/visitors"] });
      qc.invalidateQueries({ queryKey: ["/api/visitor-logs"] });
      toast.success(`${(result as Visitor).name} registered`);
      return result as Visitor;
    },
    [qc],
  );

  const doCheckIn = useCallback(
    async (id: string) => {
      await checkInVisitor(id);
      qc.invalidateQueries({ queryKey: ["/api/visitors"] });
      qc.invalidateQueries({ queryKey: ["/api/visitor-logs"] });
      toast.success("Checked in");
    },
    [qc],
  );

  const doCheckOut = useCallback(
    async (id: string) => {
      await checkOutVisitor(id);
      qc.invalidateQueries({ queryKey: ["/api/visitors"] });
      qc.invalidateQueries({ queryKey: ["/api/visitor-logs"] });
      toast.success("Checked out");
    },
    [qc],
  );

  const doBreakOut = useCallback(
    async (id: string) => {
      await visitorBreak(id);
      qc.invalidateQueries({ queryKey: ["/api/visitors"] });
      qc.invalidateQueries({ queryKey: ["/api/visitor-logs"] });
      toast.success("Marked as on break");
    },
    [qc],
  );

  const doBreakReturn = useCallback(
    async (id: string) => {
      await visitorReturn(id);
      qc.invalidateQueries({ queryKey: ["/api/visitors"] });
      qc.invalidateQueries({ queryKey: ["/api/visitor-logs"] });
      toast.success("Returned from break");
    },
    [qc],
  );

  const addGatePass = useCallback(
    async (data: Parameters<typeof createGatePass>[0]) => {
      const result = await createGatePass(data);
      qc.invalidateQueries({ queryKey: ["/api/gate-passes"] });
      qc.invalidateQueries({ queryKey: ["/api/gp-logs"] });
      toast.success("Gate pass created");
      return result as GatePass;
    },
    [qc],
  );

  const doCloseGatePass = useCallback(
    async (id: string) => {
      await closeGatePass(id);
      qc.invalidateQueries({ queryKey: ["/api/gate-passes"] });
      qc.invalidateQueries({ queryKey: ["/api/gp-logs"] });
      toast.success("Gate pass closed");
    },
    [qc],
  );

  return (
    <AppContext.Provider
      value={{
        user,
        userLoading,
        offices,
        selectedOffice,
        setSelectedOffice,
        visitors,
        visitorsLoading,
        logs,
        logsLoading,
        gatePasses,
        gatePassesLoading,
        gpLogs,
        gpLogsLoading,
        addVisitor,
        doCheckIn,
        doCheckOut,
        doBreakOut,
        doBreakReturn,
        addGatePass,
        doCloseGatePass,
        refetchAll: invalidateAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
