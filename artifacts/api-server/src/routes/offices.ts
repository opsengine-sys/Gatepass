import { Router } from "express";
import { db } from "@workspace/db";
import { officesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";

const router = Router();

// GET /api/offices
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const companyId = req.appUser!.companyId;
  if (!companyId) {
    res.json([]);
    return;
  }

  const offices = await db
    .select()
    .from(officesTable)
    .where(
      and(
        eq(officesTable.companyId, companyId),
        eq(officesTable.isActive, true),
      ),
    );

  res.json(offices);
});

// POST /api/offices
router.post(
  "/",
  requireAuth,
  requireRole("admin", "super_admin"),
  async (req: AuthenticatedRequest, res) => {
    const companyId = req.appUser!.companyId;
    if (!companyId) {
      res.status(400).json({ error: "User has no company assigned" });
      return;
    }

    const { name, city, address } = req.body;
    if (!name || !city) {
      res.status(400).json({ error: "name and city are required" });
      return;
    }

    const [office] = await db
      .insert(officesTable)
      .values({ companyId, name, city, address })
      .returning();

    res.status(201).json(office);
  },
);

// PATCH /api/offices/:officeId
router.patch(
  "/:officeId",
  requireAuth,
  requireRole("admin", "super_admin"),
  async (req: AuthenticatedRequest, res) => {
    const officeId = req.params["officeId"] as string;
    const companyId = req.appUser!.companyId;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const { name, city, address, isActive } = req.body;
    if (name !== undefined) updates.name = name;
    if (city !== undefined) updates.city = city;
    if (address !== undefined) updates.address = address;
    if (isActive !== undefined) updates.isActive = isActive;

    const conditions = [eq(officesTable.id, officeId)];
    if (companyId) conditions.push(eq(officesTable.companyId, companyId));

    const [updated] = await db
      .update(officesTable)
      .set(updates)
      .where(and(...conditions))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Office not found" });
      return;
    }

    res.json(updated);
  },
);

// DELETE /api/offices/:officeId
router.delete(
  "/:officeId",
  requireAuth,
  requireRole("admin", "super_admin"),
  async (req: AuthenticatedRequest, res) => {
    const officeId = req.params["officeId"] as string;
    const companyId = req.appUser!.companyId;

    const conditions = [eq(officesTable.id, officeId)];
    if (companyId) conditions.push(eq(officesTable.companyId, companyId));

    await db
      .update(officesTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(...conditions));

    res.status(204).send();
  },
);

export default router;
