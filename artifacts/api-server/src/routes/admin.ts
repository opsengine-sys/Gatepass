import { Router } from "express";
import { db } from "@workspace/db";
import {
  companiesTable,
  usersTable,
  officesTable,
  visitorsTable,
} from "@workspace/db/schema";
import { eq, count, and, isNotNull, desc, sql } from "drizzle-orm";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";

const router = Router();

// ─── Stats ───────────────────────────────────────────────────────────────────

// GET /api/admin/stats
router.get("/stats", requireAuth, requireSuperAdmin, async (_req, res) => {
  const [totalCompanies] = await db.select({ count: count() }).from(companiesTable);
  const [activeCompanies] = await db
    .select({ count: count() })
    .from(companiesTable)
    .where(eq(companiesTable.isActive, true));
  const [totalUsers] = await db.select({ count: count() }).from(usersTable);
  const [totalVisitors] = await db.select({ count: count() }).from(visitorsTable);

  // License breakdown
  const licenseBreakdown = await db
    .select({
      status: sql<string>`COALESCE(${companiesTable.licenseStatus}, 'trial')`,
      cnt: count(),
    })
    .from(companiesTable)
    .groupBy(sql`COALESCE(${companiesTable.licenseStatus}, 'trial')`);

  // Plan breakdown
  const planBreakdown = await db
    .select({ plan: companiesTable.plan, cnt: count() })
    .from(companiesTable)
    .groupBy(companiesTable.plan);

  // Recently added companies (last 5)
  const recentCompanies = await db
    .select()
    .from(companiesTable)
    .orderBy(desc(companiesTable.createdAt))
    .limit(5);

  // Expiring contracts (contractEnd in next 60 days)
  const expiring = await db
    .select()
    .from(companiesTable)
    .where(
      and(
        isNotNull(companiesTable.contractEnd),
        sql`${companiesTable.contractEnd} > NOW()`,
        sql`${companiesTable.contractEnd} < NOW() + INTERVAL '60 days'`,
      ),
    )
    .orderBy(companiesTable.contractEnd)
    .limit(5);

  res.json({
    totalCompanies: Number(totalCompanies.count),
    activeCompanies: Number(activeCompanies.count),
    totalUsers: Number(totalUsers.count),
    totalVisitors: Number(totalVisitors.count),
    licenseBreakdown,
    planBreakdown,
    recentCompanies,
    expiring,
  });
});

// ─── Companies ────────────────────────────────────────────────────────────────

// GET /api/admin/companies
router.get("/companies", requireAuth, requireSuperAdmin, async (_req, res) => {
  const companies = await db
    .select()
    .from(companiesTable)
    .orderBy(desc(companiesTable.createdAt));

  const withStats = await Promise.all(
    companies.map(async (c) => {
      const [userResult] = await db
        .select({ count: count() })
        .from(usersTable)
        .where(eq(usersTable.companyId, c.id));

      const [officeResult] = await db
        .select({ count: count() })
        .from(officesTable)
        .where(eq(officesTable.companyId, c.id));

      const [visitorResult] = await db
        .select({ count: count() })
        .from(visitorsTable)
        .where(eq(visitorsTable.companyId, c.id));

      return {
        ...c,
        userCount: Number(userResult?.count ?? 0),
        officeCount: Number(officeResult?.count ?? 0),
        visitorCount: Number(visitorResult?.count ?? 0),
      };
    }),
  );

  res.json(withStats);
});

// POST /api/admin/companies
router.post(
  "/companies",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    const {
      name, slug, plan,
      contactName, contactEmail, contactPhone,
      contractStart, contractEnd, contractValue,
      products, licenseStatus, notes,
    } = req.body;

    if (!name || !slug) {
      res.status(400).json({ error: "name and slug are required" });
      return;
    }

    const [company] = await db
      .insert(companiesTable)
      .values({
        name,
        slug,
        plan: plan ?? "starter",
        contactName: contactName ?? null,
        contactEmail: contactEmail ?? null,
        contactPhone: contactPhone ?? null,
        contractStart: contractStart ? new Date(contractStart) : null,
        contractEnd: contractEnd ? new Date(contractEnd) : null,
        contractValue: contractValue ?? null,
        products: products ? JSON.stringify(products) : "[]",
        licenseStatus: licenseStatus ?? "trial",
        notes: notes ?? null,
      })
      .returning();

    res.status(201).json(company);
  },
);

// PATCH /api/admin/companies/:companyId
router.patch(
  "/companies/:companyId",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { companyId } = req.params;
    const {
      name, plan, isActive, logoUrl,
      contactName, contactEmail, contactPhone,
      contractStart, contractEnd, contractValue,
      products, licenseStatus, notes,
    } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (plan !== undefined) updates.plan = plan;
    if (isActive !== undefined) updates.isActive = isActive;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl;
    if (contactName !== undefined) updates.contactName = contactName;
    if (contactEmail !== undefined) updates.contactEmail = contactEmail;
    if (contactPhone !== undefined) updates.contactPhone = contactPhone;
    if (contractStart !== undefined) updates.contractStart = contractStart ? new Date(contractStart) : null;
    if (contractEnd !== undefined) updates.contractEnd = contractEnd ? new Date(contractEnd) : null;
    if (contractValue !== undefined) updates.contractValue = contractValue;
    if (products !== undefined) updates.products = JSON.stringify(products);
    if (licenseStatus !== undefined) updates.licenseStatus = licenseStatus;
    if (notes !== undefined) updates.notes = notes;

    const [updated] = await db
      .update(companiesTable)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set(updates as any)
      .where(eq(companiesTable.id, companyId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Company not found" });
      return;
    }

    res.json(updated);
  },
);

// DELETE /api/admin/companies/:companyId  (soft-delete)
router.delete(
  "/companies/:companyId",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { companyId } = req.params;
    await db
      .update(companiesTable)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set({ isActive: false, updatedAt: new Date() } as any)
      .where(eq(companiesTable.id, companyId));
    res.status(204).send();
  },
);

// ─── Users ────────────────────────────────────────────────────────────────────

// GET /api/admin/users
router.get(
  "/users",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { companyId } = req.query as Record<string, string>;

    const users = companyId
      ? await db.select().from(usersTable).where(eq(usersTable.companyId, companyId)).orderBy(desc(usersTable.createdAt))
      : await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));

    const enriched = await Promise.all(
      users.map(async (u) => {
        let company = null;
        let office = null;

        if (u.companyId) {
          const [c] = await db.select().from(companiesTable).where(eq(companiesTable.id, u.companyId)).limit(1);
          company = c ?? null;
        }
        if (u.officeId) {
          const [o] = await db.select().from(officesTable).where(eq(officesTable.id, u.officeId)).limit(1);
          office = o ?? null;
        }

        return { ...u, company, office };
      }),
    );

    res.json(enriched);
  },
);

// PATCH /api/admin/users/:userId
router.patch(
  "/users/:userId",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { userId } = req.params;
    const { role, companyId, officeId, isActive } = req.body;

    // Prevent promoting any user to super_admin via the API.
    // super_admin can only be assigned directly in the database.
    const ASSIGNABLE_ROLES = ["admin", "security", "viewer"];
    if (role !== undefined && !ASSIGNABLE_ROLES.includes(role)) {
      res.status(400).json({ error: `Role "${role}" cannot be assigned via the API. Use direct DB access for super_admin.` });
      return;
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (role !== undefined) updates.role = role;
    if (companyId !== undefined) updates.companyId = companyId || null;
    if (officeId !== undefined) updates.officeId = officeId || null;
    if (isActive !== undefined) updates.isActive = isActive;

    const [updated] = await db
      .update(usersTable)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set(updates as any)
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let company = null;
    let office = null;
    if (updated.companyId) {
      const [c] = await db.select().from(companiesTable).where(eq(companiesTable.id, updated.companyId)).limit(1);
      company = c ?? null;
    }
    if (updated.officeId) {
      const [o] = await db.select().from(officesTable).where(eq(officesTable.id, updated.officeId)).limit(1);
      office = o ?? null;
    }

    res.json({ ...updated, company, office });
  },
);

// ─── Activity feed ────────────────────────────────────────────────────────────

// GET /api/admin/activity — recent sign-ups + company creations
router.get("/activity", requireAuth, requireSuperAdmin, async (_req, res) => {
  const recentUsers = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, createdAt: usersTable.createdAt })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(20);

  const recentCompanies = await db
    .select({ id: companiesTable.id, name: companiesTable.name, plan: companiesTable.plan, createdAt: companiesTable.createdAt })
    .from(companiesTable)
    .orderBy(desc(companiesTable.createdAt))
    .limit(10);

  const events = [
    ...recentUsers.map((u) => ({
      type: "user_signup" as const,
      id: u.id,
      label: `${u.name} signed up`,
      detail: u.email,
      ts: u.createdAt,
    })),
    ...recentCompanies.map((c) => ({
      type: "company_created" as const,
      id: c.id,
      label: `Company "${c.name}" created`,
      detail: c.plan,
      ts: c.createdAt,
    })),
  ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 30);

  res.json(events);
});

export default router;
