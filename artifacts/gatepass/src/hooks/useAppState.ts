import { useState, useCallback, useEffect } from "react";
import type { Visitor, GatePass, VisitorLog, GPLog, VisitorType, GPType } from "@/types";
import { OFFICES } from "@/types";

function uid() { return Math.random().toString(36).slice(2, 9); }
function uid6() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }
export function genVID() { return "GP-" + uid6() + "-" + uid6(); }
export function genGPID() { return "GPP-" + uid6(); }

function sameDay(d1: string | undefined, d2: Date) {
  if (!d1) return false;
  return new Date(d1).toDateString() === d2.toDateString();
}

const SEED_VISITORS: Visitor[] = [
  {
    id: "seed1", visitorId: "GP-ABCD12-EF3456", name: "Rajesh Kumar", company: "Infosys Ltd",
    type: "vendor", status: "checked-in", office: OFFICES[0], host: "Priya Sharma",
    hostPhone: "9876543210", purpose: "Software demo and renewal discussion",
    contractRef: "PO-2025-0042", serviceType: "IT Software",
    onBreak: false, checkin: new Date(Date.now() - 2 * 3600000).toISOString(),
    breaks: [],
  },
  {
    id: "seed2", visitorId: "GP-MNOP34-QR7890", name: "Ananya Singh",
    type: "candidate", status: "checked-in", office: OFFICES[0],
    host: "Meera Nair", hostPhone: "9123456789",
    purpose: "Round 2 Technical Interview", jobId: "SWE-2025-047", interviewRound: "Round 2 — Technical",
    onBreak: true, checkin: new Date(Date.now() - 3600000).toISOString(),
    breaks: [{ out: new Date(Date.now() - 1800000).toISOString(), returnTime: null }],
  },
  {
    id: "seed3", visitorId: "GP-WXYZ56-AB1234", name: "Suresh Reddy", company: "ABC Corp",
    type: "guest", status: "checked-out", office: OFFICES[0], host: "Vikram Patel",
    hostPhone: "9988776655", purpose: "Partnership meeting",
    relationship: "Business Associate",
    onBreak: false, checkin: new Date(Date.now() - 5 * 3600000).toISOString(),
    checkout: new Date(Date.now() - 1 * 3600000).toISOString(),
    breaks: [],
  },
  {
    id: "seed4", visitorId: "GP-KLMN78-CD5678", name: "Priya Mehta", company: "Google India",
    type: "leadership", status: "pending", office: OFFICES[0],
    host: "CEO Office", hostPhone: "9900000001",
    purpose: "Q3 Business Review", homeOffice: "Google Mountain View HQ",
    visitAgenda: "Q3 Business Review and Partnership Discussion",
    onBreak: false, checkin: new Date(Date.now() + 3600000).toISOString(),
    breaks: [],
  },
];

const SEED_GATE_PASSES: GatePass[] = [
  {
    id: "gp-seed1", gpId: "GPP-ABCD12", type: "material", requestedBy: "Facilities Team",
    requesterPhone: "9800000001", vendor: "Ashok Hardware", vehicleNo: "TS09EF1234",
    expectedDate: new Date().toISOString().split("T")[0],
    office: OFFICES[0], purpose: "Office renovation supplies",
    status: "open", createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    items: [
      { name: "PVC Pipes", qty: "50 units", desc: "2 inch diameter" },
      { name: "Cable Trays", qty: "20 units", desc: "" },
    ],
  },
  {
    id: "gp-seed2", gpId: "GPP-EFGH34", type: "food", requestedBy: "HR Team",
    vendor: "Tasty Caterers", office: OFFICES[0], purpose: "All hands meeting lunch",
    status: "closed", createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    closedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    items: [{ name: "Lunch boxes", qty: "120", desc: "Veg + Non-veg assorted" }],
  },
];

const SEED_LOGS: VisitorLog[] = [
  { id: "l1", type: "checkin", visitor: "Rajesh Kumar", vid: "GP-ABCD12-EF3456", time: new Date(Date.now() - 2 * 3600000).toISOString(), office: OFFICES[0], note: "Registered" },
  { id: "l2", type: "checkin", visitor: "Ananya Singh", vid: "GP-MNOP34-QR7890", time: new Date(Date.now() - 3600000).toISOString(), office: OFFICES[0], note: "Registered" },
  { id: "l3", type: "break-out", visitor: "Ananya Singh", vid: "GP-MNOP34-QR7890", time: new Date(Date.now() - 1800000).toISOString(), office: OFFICES[0], note: "Step out — still checked in" },
  { id: "l4", type: "checkin", visitor: "Suresh Reddy", vid: "GP-WXYZ56-AB1234", time: new Date(Date.now() - 5 * 3600000).toISOString(), office: OFFICES[0], note: "Registered" },
  { id: "l5", type: "checkout", visitor: "Suresh Reddy", vid: "GP-WXYZ56-AB1234", time: new Date(Date.now() - 3600000).toISOString(), office: OFFICES[0] },
];

const SEED_GP_LOGS: GPLog[] = [
  { id: "gl1", type: "created", passId: "GPP-ABCD12", by: "Facilities Team", time: new Date(Date.now() - 4 * 3600000).toISOString(), office: OFFICES[0] },
  { id: "gl2", type: "created", passId: "GPP-EFGH34", by: "HR Team", time: new Date(Date.now() - 8 * 3600000).toISOString(), office: OFFICES[0] },
  { id: "gl3", type: "closed", passId: "GPP-EFGH34", by: "Security", time: new Date(Date.now() - 3 * 3600000).toISOString(), office: OFFICES[0] },
];

interface AppState {
  office: string;
  visitors: Visitor[];
  gatePasses: GatePass[];
  logs: VisitorLog[];
  gpLogs: GPLog[];
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem("gatepass-state");
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    office: OFFICES[0],
    visitors: SEED_VISITORS,
    gatePasses: SEED_GATE_PASSES,
    logs: SEED_LOGS,
    gpLogs: SEED_GP_LOGS,
  };
}

function saveState(s: AppState) {
  try { localStorage.setItem("gatepass-state", JSON.stringify(s)); } catch {}
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);

  const update = useCallback((updater: (s: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const setOffice = useCallback((office: string) => {
    update(s => ({ ...s, office }));
  }, [update]);

  const addVisitor = useCallback((v: Visitor) => {
    update(s => ({
      ...s,
      visitors: [...s.visitors, v],
      logs: [...s.logs, { id: uid(), type: "checkin", visitor: v.name, vid: v.visitorId, time: v.checkin, office: v.office, note: "Registered" }],
    }));
  }, [update]);

  const checkIn = useCallback((id: string) => {
    update(s => {
      const v = s.visitors.find(x => x.id === id);
      if (!v) return s;
      if (v.status === "checked-in") return s;
      if (v.status === "checked-out" && v.checkout && sameDay(v.checkout, new Date())) return s;
      const now = new Date().toISOString();
      return {
        ...s,
        visitors: s.visitors.map(x => x.id === id ? { ...x, status: "checked-in" as const, checkin: now, checkout: undefined, onBreak: false } : x),
        logs: [...s.logs, { id: uid(), type: "checkin" as const, visitor: v.name, vid: v.visitorId, time: now, office: v.office }],
      };
    });
  }, [update]);

  const checkOut = useCallback((id: string) => {
    update(s => {
      const v = s.visitors.find(x => x.id === id);
      if (!v || v.status === "checked-out") return s;
      const now = new Date().toISOString();
      const updatedBreaks = v.breaks.map((b, i) =>
        i === v.breaks.length - 1 && !b.returnTime ? { ...b, returnTime: now } : b
      );
      return {
        ...s,
        visitors: s.visitors.map(x => x.id === id ? { ...x, status: "checked-out" as const, checkout: now, onBreak: false, breaks: updatedBreaks } : x),
        logs: [...s.logs, { id: uid(), type: "checkout" as const, visitor: v.name, vid: v.visitorId, time: now, office: v.office }],
      };
    });
  }, [update]);

  const breakOut = useCallback((id: string) => {
    update(s => {
      const v = s.visitors.find(x => x.id === id);
      if (!v || v.status !== "checked-in" || v.onBreak) return s;
      const now = new Date().toISOString();
      return {
        ...s,
        visitors: s.visitors.map(x => x.id === id ? { ...x, onBreak: true, breaks: [...x.breaks, { out: now, returnTime: null }] } : x),
        logs: [...s.logs, { id: uid(), type: "break-out" as const, visitor: v.name, vid: v.visitorId, time: now, office: v.office, note: "Step out — still checked in" }],
      };
    });
  }, [update]);

  const breakReturn = useCallback((id: string) => {
    update(s => {
      const v = s.visitors.find(x => x.id === id);
      if (!v || !v.onBreak) return s;
      const now = new Date().toISOString();
      const updatedBreaks = v.breaks.map((b, i) =>
        i === v.breaks.length - 1 && !b.returnTime ? { ...b, returnTime: now } : b
      );
      return {
        ...s,
        visitors: s.visitors.map(x => x.id === id ? { ...x, onBreak: false, breaks: updatedBreaks } : x),
        logs: [...s.logs, { id: uid(), type: "break-return" as const, visitor: v.name, vid: v.visitorId, time: now, office: v.office, note: "Returned from break" }],
      };
    });
  }, [update]);

  const addGatePass = useCallback((g: GatePass) => {
    update(s => ({
      ...s,
      gatePasses: [...s.gatePasses, g],
      gpLogs: [...s.gpLogs, { id: uid(), type: "created" as const, passId: g.gpId, by: g.requestedBy, time: g.createdAt, office: g.office }],
    }));
  }, [update]);

  const closeGatePass = useCallback((id: string) => {
    update(s => {
      const g = s.gatePasses.find(x => x.id === id);
      if (!g) return s;
      const now = new Date().toISOString();
      return {
        ...s,
        gatePasses: s.gatePasses.map(x => x.id === id ? { ...x, status: "closed" as const, closedAt: now } : x),
        gpLogs: [...s.gpLogs, { id: uid(), type: "closed" as const, passId: g.gpId, by: "Security", time: now, office: g.office }],
      };
    });
  }, [update]);

  return {
    state,
    setOffice,
    addVisitor,
    checkIn,
    checkOut,
    breakOut,
    breakReturn,
    addGatePass,
    closeGatePass,
    genVID,
    genGPID,
    uid,
  };
}

export function fmtTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDate(d?: string | Date) {
  if (!d) return "—";
  return new Date(d as string).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDT(d?: string) {
  if (!d) return "—";
  return fmtDate(d) + ", " + fmtTime(d);
}

export function initials(name: string) {
  return (name || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function sameDay2(d1: string | undefined, d2: Date) {
  if (!d1) return false;
  return new Date(d1).toDateString() === d2.toDateString();
}

export function exportCSV(visitors: Visitor[], office: string) {
  const vs = visitors.filter(v => v.office === office);
  const cols = ["visitorId","name","company","email","phone","type","host","hostPhone","office","purpose","status","checkin","checkout"];
  const header = cols.join(",");
  const rows = vs.map(v => cols.map(c => {
    const val = (v as Record<string,unknown>)[c];
    return `"${(val == null ? "" : String(val)).replace(/"/g, '""')}"`;
  }).join(","));
  const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `visitors-${Date.now()}.csv`;
  a.click();
}

export function exportGPCSV(gatePasses: GatePass[], office: string) {
  const gps = gatePasses.filter(g => g.office === office);
  const cols = ["gpId","type","requestedBy","vendor","vehicleNo","office","purpose","status","createdAt","closedAt"];
  const header = cols.join(",");
  const rows = gps.map(g => cols.map(c => {
    const val = (g as Record<string,unknown>)[c];
    return `"${(val == null ? "" : String(val)).replace(/"/g, '""')}"`;
  }).join(","));
  const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `gate-passes-${Date.now()}.csv`;
  a.click();
}
