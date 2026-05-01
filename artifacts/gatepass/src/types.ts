export type VisitorType = "vendor" | "candidate" | "guest" | "leadership" | "employee";
export type VisitorStatus = "checked-in" | "checked-out" | "pending";
export type GPType = "material" | "food" | "outgoing" | "contractor";
export type GPStatus = "open" | "closed" | "pending";

export interface Break {
  out: string;
  returnTime: string | null;
}

export interface Visitor {
  id: string;
  visitorId: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  type: VisitorType;
  status: VisitorStatus;
  office: string;
  host?: string;
  hostPhone?: string;
  purpose?: string;
  address?: string;
  photo?: string;
  onBreak: boolean;
  checkin: string;
  checkout?: string;
  breaks: Break[];
  contractRef?: string;
  serviceType?: string;
  jobId?: string;
  interviewRound?: string;
  relationship?: string;
  homeOffice?: string;
  visitAgenda?: string;
  employeeId?: string;
  department?: string;
}

export interface GPItem {
  name: string;
  qty: string;
  desc?: string;
}

export interface GatePass {
  id: string;
  gpId: string;
  type: GPType;
  requestedBy: string;
  requesterPhone?: string;
  vendor?: string;
  vehicleNo?: string;
  expectedDate?: string;
  office: string;
  purpose: string;
  status: GPStatus;
  items: GPItem[];
  createdAt: string;
  closedAt?: string;
}

export interface VisitorLog {
  id: string;
  type: "checkin" | "checkout" | "break-out" | "break-return";
  visitor: string;
  vid: string;
  time: string;
  office: string;
  note?: string;
}

export interface GPLog {
  id: string;
  type: "created" | "closed";
  passId: string;
  by: string;
  time: string;
  office: string;
}

export const OFFICES = [
  "Hyderabad — Raheja Mindspace",
  "Hyderabad — DLF Cybercity",
  "Bangalore — Embassy Tech Village",
  "Mumbai — BKC",
  "Chennai — Tidel Park",
  "Pune — Hinjewadi",
];

export const VISITOR_TYPES: { id: VisitorType; label: string; color: string; needsBadge: boolean }[] = [
  { id: "vendor", label: "Vendor", color: "amber", needsBadge: true },
  { id: "candidate", label: "Interview Candidate", color: "blue", needsBadge: true },
  { id: "guest", label: "Guest", color: "green", needsBadge: true },
  { id: "leadership", label: "Leadership Visit", color: "purple", needsBadge: false },
  { id: "employee", label: "Employee (Forgot ID)", color: "slate", needsBadge: true },
];

export const GP_TYPES: { id: GPType; label: string; sub: string }[] = [
  { id: "material", label: "Materials / Supplies", sub: "Raw materials, equipment, tools" },
  { id: "food", label: "Food & Beverages", sub: "Catering, delivery, pantry" },
  { id: "outgoing", label: "Outgoing Assets", sub: "Company property leaving premises" },
  { id: "contractor", label: "Contractor Supplies", sub: "Contractor tools & equipment" },
];

export const POC_CFG: Record<VisitorType, { show: boolean; hostLabel?: string; phoneLabel?: string }> = {
  vendor: { show: true, hostLabel: "Host / Point of Contact", phoneLabel: "Host Phone" },
  candidate: { show: true, hostLabel: "HR Point of Contact", phoneLabel: "HR Phone" },
  guest: { show: true, hostLabel: "Host Name", phoneLabel: "Host Phone" },
  leadership: { show: true, hostLabel: "Host / Sponsor", phoneLabel: "Host Phone" },
  employee: { show: false },
};

export const NEEDS_PURPOSE: Record<VisitorType, boolean> = {
  vendor: true, candidate: true, guest: true, leadership: true, employee: false,
};

export const NEEDS_COMPANY: Record<VisitorType, boolean> = {
  vendor: true, candidate: false, guest: false, leadership: true, employee: true,
};

export type TypeColor = "amber" | "blue" | "green" | "purple" | "slate";

export const TYPE_COLORS: Record<VisitorType, string> = {
  vendor: "#a07a14",
  candidate: "#2558a8",
  guest: "#1a7a4a",
  leadership: "#6438a0",
  employee: "#445368",
};
