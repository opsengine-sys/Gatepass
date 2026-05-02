// API-compatible types matching backend schema

export type VisitorType =
  | "Guest"
  | "Vendor"
  | "Contractor"
  | "Interview Candidate"
  | "Delivery"
  | "Government Official"
  | "Leadership Visit"
  | "Employee (Forgot ID)"
  | "Other";

export type VisitorStatus = "Pending" | "Checked In" | "On Break" | "Checked Out";

export type GPType =
  | "Materials / Supplies"
  | "Equipment"
  | "Food & Beverages"
  | "Documents"
  | "IT Assets"
  | "Furniture"
  | "Samples"
  | "Other";

export type GPStatus = "Open" | "Closed";

export interface GPItem {
  name: string;
  qty: number;
  unit: string;
}

export interface Visitor {
  id: string;
  companyId: string;
  officeId: string;
  visitorId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  hostName?: string | null;
  type: VisitorType;
  status: VisitorStatus;
  purpose?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  photoUrl?: string | null;
  vehicleNumber?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  expectedCheckout?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GatePass {
  id: string;
  companyId: string;
  officeId: string;
  passId: string;
  purpose: string;
  type: GPType;
  status: GPStatus;
  vendorName?: string | null;
  vehicleNo?: string | null;
  driverName?: string | null;
  requestedBy: string;
  items: GPItem[];
  itemCount?: number;
  openedAt?: string;
  closedAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface VisitorLog {
  id: string;
  visitorDbId?: string;
  visitorId: string;
  companyId: string;
  officeId: string;
  name: string;
  action: string;
  note?: string | null;
  ts: string;
}

export interface GPLog {
  id: string;
  passId: string;
  gatePassId?: string;
  companyId: string;
  officeId: string;
  action: string;
  note?: string | null;
  ts: string;
}

export interface Office {
  id: string;
  companyId: string;
  name: string;
  city: string;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LicenseStatus = "trial" | "active" | "expired" | "suspended";
export type ProductKey =
  | "visitor_management"
  | "gate_pass"
  | "multi_office"
  | "analytics"
  | "api_access";

export const PRODUCT_LABELS: Record<ProductKey, string> = {
  visitor_management: "Visitor Management",
  gate_pass: "Gate Pass",
  multi_office: "Multi-Office",
  analytics: "Analytics & Reports",
  api_access: "API Access",
};

export const ALL_PRODUCTS: ProductKey[] = [
  "visitor_management",
  "gate_pass",
  "multi_office",
  "analytics",
  "api_access",
];

export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  plan: "starter" | "growth" | "enterprise";
  isActive: boolean;
  // CRM
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  // Contract
  contractStart?: string | null;
  contractEnd?: string | null;
  contractValue?: string | null;
  // License
  products?: string | null;        // JSON string: ProductKey[]
  licenseStatus?: string | null;   // LicenseStatus
  maxSeats?: string | number | null;
  seatsUsed?: string | number | null;
  notes?: string | null;
  contacts?: string | null;  // JSON: CompanyContact[]
  createdAt: string;
  updatedAt: string;
  // Computed stats (from API)
  userCount?: number;
  officeCount?: number;
  visitorCount?: number;
}

export interface UserProfile {
  id: string;
  clerkId: string;
  companyId?: string | null;
  officeId?: string | null;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "security" | "viewer";
  isActive: boolean;
  createdAt: string;
  company?: Company | null;
  office?: Office | null;
}

export const VISITOR_TYPES: VisitorType[] = [
  "Vendor",
  "Guest",
  "Contractor",
  "Interview Candidate",
  "Delivery",
  "Government Official",
  "Leadership Visit",
  "Employee (Forgot ID)",
  "Other",
];

export const GP_TYPES: GPType[] = [
  "Materials / Supplies",
  "Equipment",
  "Food & Beverages",
  "Documents",
  "IT Assets",
  "Furniture",
  "Samples",
  "Other",
];

export interface CompanyContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: "Primary" | "Technical" | "Billing" | "Operations" | "Other";
}

export const CONTACT_ROLES = ["Primary", "Technical", "Billing", "Operations", "Other"] as const;

export const TYPE_COLORS: Record<string, string> = {
  Vendor: "#a07a14",
  Guest: "#1a7a4a",
  Contractor: "#c06b2c",
  "Interview Candidate": "#2558a8",
  Delivery: "#0e7490",
  "Government Official": "#9d174d",
  "Leadership Visit": "#6438a0",
  "Employee (Forgot ID)": "#445368",
  Other: "#445368",
};
