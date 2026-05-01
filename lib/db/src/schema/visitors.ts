import {
  pgTable,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { officesTable } from "./offices";

export const visitorTypeEnum = pgEnum("visitor_type", [
  "Guest",
  "Vendor",
  "Contractor",
  "Interview Candidate",
  "Delivery",
  "Government Official",
  "Leadership Visit",
  "Other",
]);

export const visitorStatusEnum = pgEnum("visitor_status", [
  "Pending",
  "Checked In",
  "On Break",
  "Checked Out",
]);

export const visitorsTable = pgTable("visitors", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id")
    .notNull()
    .references(() => companiesTable.id, { onDelete: "cascade" }),
  officeId: text("office_id")
    .notNull()
    .references(() => officesTable.id, { onDelete: "cascade" }),
  visitorId: text("visitor_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  company: text("company"),
  host: text("host").notNull(),
  type: visitorTypeEnum("type").notNull(),
  status: visitorStatusEnum("status").default("Pending").notNull(),
  purpose: text("purpose"),
  idType: text("id_type"),
  idNumber: text("id_number"),
  photoUrl: text("photo_url"),
  vehicleNumber: text("vehicle_number"),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  expectedCheckout: timestamp("expected_checkout"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const visitorLogsTable = pgTable("visitor_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  vid: text("vid").notNull(),
  visitorId: text("visitor_id")
    .notNull()
    .references(() => visitorsTable.id, { onDelete: "cascade" }),
  companyId: text("company_id")
    .notNull()
    .references(() => companiesTable.id, { onDelete: "cascade" }),
  officeId: text("office_id").notNull(),
  name: text("name").notNull(),
  action: text("action").notNull(),
  note: text("note"),
  ts: timestamp("ts").defaultNow().notNull(),
});

export const insertVisitorSchema = createInsertSchema(visitorsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectVisitorSchema = createSelectSchema(visitorsTable);
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type Visitor = typeof visitorsTable.$inferSelect;

export const insertVisitorLogSchema = createInsertSchema(visitorLogsTable).omit({
  id: true,
});
export type InsertVisitorLog = z.infer<typeof insertVisitorLogSchema>;
export type VisitorLog = typeof visitorLogsTable.$inferSelect;
