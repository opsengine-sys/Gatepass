import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const planEnum = pgEnum("plan", ["starter", "growth", "enterprise"]);

export const companiesTable = pgTable("companies", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  plan: planEnum("plan").default("starter").notNull(),
  isActive: boolean("is_active").default(true).notNull(),

  // CRM fields
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),

  // Contract
  contractStart: timestamp("contract_start"),
  contractEnd: timestamp("contract_end"),
  contractValue: text("contract_value"),

  // License & products (stored as JSON string: string[])
  products: text("products").default("[]"),
  licenseStatus: text("license_status").default("trial"),

  notes: text("notes"),
  contacts: text("contacts").default("[]"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(companiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectCompanySchema = createSelectSchema(companiesTable);
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companiesTable.$inferSelect;
