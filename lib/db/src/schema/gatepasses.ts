import { pgTable, text, timestamp, integer, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { officesTable } from "./offices";

export const gpTypeEnum = pgEnum("gp_type", [
  "Materials / Supplies",
  "Equipment",
  "Food & Beverages",
  "Documents",
  "IT Assets",
  "Furniture",
  "Samples",
  "Other",
]);

export const gpStatusEnum = pgEnum("gp_status", ["Open", "Closed"]);

export const gatePassesTable = pgTable("gate_passes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id")
    .notNull()
    .references(() => companiesTable.id, { onDelete: "cascade" }),
  officeId: text("office_id")
    .notNull()
    .references(() => officesTable.id, { onDelete: "cascade" }),
  passId: text("pass_id").notNull(),
  purpose: text("purpose").notNull(),
  type: gpTypeEnum("type").notNull(),
  status: gpStatusEnum("status").default("Open").notNull(),
  vendorName: text("vendor_name"),
  vehicleNo: text("vehicle_no"),
  driverName: text("driver_name"),
  requestedBy: text("requested_by").notNull(),
  requestedById: text("requested_by_id"),
  items: jsonb("items").$type<Array<{ name: string; qty: number; unit: string }>>().default([]).notNull(),
  itemCount: integer("item_count").default(0).notNull(),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gpLogsTable = pgTable("gp_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  passId: text("pass_id").notNull(),
  gatePassId: text("gate_pass_id")
    .notNull()
    .references(() => gatePassesTable.id, { onDelete: "cascade" }),
  companyId: text("company_id")
    .notNull()
    .references(() => companiesTable.id, { onDelete: "cascade" }),
  officeId: text("office_id").notNull(),
  type: text("type").notNull(),
  by: text("by").notNull(),
  note: text("note"),
  ts: timestamp("ts").defaultNow().notNull(),
});

export const insertGatePassSchema = createInsertSchema(gatePassesTable).omit({
  id: true,
  createdAt: true,
});
export const selectGatePassSchema = createSelectSchema(gatePassesTable);
export type InsertGatePass = z.infer<typeof insertGatePassSchema>;
export type GatePass = typeof gatePassesTable.$inferSelect;

export const insertGpLogSchema = createInsertSchema(gpLogsTable).omit({ id: true });
export type InsertGpLog = z.infer<typeof insertGpLogSchema>;
export type GpLog = typeof gpLogsTable.$inferSelect;
