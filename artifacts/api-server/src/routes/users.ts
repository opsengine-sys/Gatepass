import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, companiesTable, officesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";

const router = Router();

async function enrichUsers(users: (typeof usersTable.$inferSelect)[]) {
  return Promise.all(
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
}

// GET /api/users — list company users (admin+)
router.get(
  "/",
  requireAuth,
  requireRole("admin", "super_admin"),
  async (req: AuthenticatedRequest, res) => {
    const companyId = req.appUser!.companyId;
    if (!companyId) {
      res.json([]);
      return;
    }

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.companyId, companyId));

    res.json(await enrichUsers(users));
  },
);

// PATCH /api/users/:userId
router.patch(
  "/:userId",
  requireAuth,
  requireRole("admin", "super_admin"),
  async (req: AuthenticatedRequest, res) => {
    const userId = req.params["userId"] as string;
    const { role, officeId, isActive } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (role !== undefined) updates.role = role;
    if (officeId !== undefined) updates.officeId = officeId;
    if (isActive !== undefined) updates.isActive = isActive;

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(
        and(
          eq(usersTable.id, userId),
          eq(usersTable.companyId, req.appUser!.companyId as string),
        ),
      )
      .returning();

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [enriched] = await enrichUsers([updated]);
    res.json(enriched);
  },
);

// DELETE /api/users/:userId
router.delete(
  "/:userId",
  requireAuth,
  requireRole("admin", "super_admin"),
  async (req: AuthenticatedRequest, res) => {
    const userId = req.params["userId"] as string;

    await db
      .update(usersTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(usersTable.id, userId),
          eq(usersTable.companyId, req.appUser!.companyId as string),
        ),
      );

    res.status(204).send();
  },
);

export default router;
