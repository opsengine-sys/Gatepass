import { Router } from "express";
import { db } from "@workspace/db";
import {
  companiesTable,
  usersTable,
  officesTable,
} from "@workspace/db/schema";
import { eq, count } from "drizzle-orm";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";

const router = Router();

// GET /api/admin/companies
router.get(
  "/companies",
  requireAuth,
  requireSuperAdmin,
  async (_req, res) => {
    const companies = await db.select().from(companiesTable);

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

        return {
          ...c,
          userCount: Number(userResult?.count ?? 0),
          officeCount: Number(officeResult?.count ?? 0),
        };
      }),
    );

    res.json(withStats);
  },
);

// POST /api/admin/companies
router.post(
  "/companies",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { name, slug, plan } = req.body;
    if (!name || !slug) {
      res.status(400).json({ error: "name and slug are required" });
      return;
    }

    const [company] = await db
      .insert(companiesTable)
      .values({ name, slug, plan: plan ?? "starter" })
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
    const { name, plan, isActive, logoUrl } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (plan !== undefined) updates.plan = plan;
    if (isActive !== undefined) updates.isActive = isActive;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl;

    const [updated] = await db
      .update(companiesTable)
      .set(updates)
      .where(eq(companiesTable.id, companyId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Company not found" });
      return;
    }

    res.json(updated);
  },
);

// DELETE /api/admin/companies/:companyId
router.delete(
  "/companies/:companyId",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { companyId } = req.params;

    await db
      .update(companiesTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(companiesTable.id, companyId));

    res.status(204).send();
  },
);

// GET /api/admin/users
router.get(
  "/users",
  requireAuth,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { companyId } = req.query as Record<string, string>;

    const users = companyId
      ? await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.companyId, companyId))
      : await db.select().from(usersTable);

    const enriched = await Promise.all(
      users.map(async (u) => {
        let company = null;
        let office = null;

        if (u.companyId) {
          const [c] = await db
            .select()
            .from(companiesTable)
            .where(eq(companiesTable.id, u.companyId))
            .limit(1);
          company = c ?? null;
        }

        if (u.officeId) {
          const [o] = await db
            .select()
            .from(officesTable)
            .where(eq(officesTable.id, u.officeId))
            .limit(1);
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

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (role !== undefined) updates.role = role;
    if (companyId !== undefined) updates.companyId = companyId;
    if (officeId !== undefined) updates.officeId = officeId;
    if (isActive !== undefined) updates.isActive = isActive;

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let company = null;
    let office = null;

    if (updated.companyId) {
      const [c] = await db
        .select()
        .from(companiesTable)
        .where(eq(companiesTable.id, updated.companyId))
        .limit(1);
      company = c ?? null;
    }

    if (updated.officeId) {
      const [o] = await db
        .select()
        .from(officesTable)
        .where(eq(officesTable.id, updated.officeId))
        .limit(1);
      office = o ?? null;
    }

    res.json({ ...updated, company, office });
  },
);

export default router;
