import { Router } from "express";
import { db } from "@workspace/db";
import { companiesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";

const router = Router();

// GET /api/company-settings
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const companyId = req.appUser!.companyId;
  if (!companyId) {
    res.json({});
    return;
  }

  const [company] = await db
    .select({ settings: companiesTable.settings })
    .from(companiesTable)
    .where(eq(companiesTable.id, companyId))
    .limit(1);

  if (!company) {
    res.json({});
    return;
  }

  try {
    res.json(JSON.parse(company.settings ?? "{}"));
  } catch {
    res.json({});
  }
});

// PATCH /api/company-settings
router.patch(
  "/",
  requireAuth,
  requireRole("admin", "super_admin"),
  async (req: AuthenticatedRequest, res) => {
    const companyId = req.appUser!.companyId;
    if (!companyId) {
      res.status(400).json({ error: "No company assigned" });
      return;
    }

    const patch = req.body as Record<string, unknown>;

    // Read existing settings and deep-merge
    const [company] = await db
      .select({ settings: companiesTable.settings })
      .from(companiesTable)
      .where(eq(companiesTable.id, companyId))
      .limit(1);

    let existing: Record<string, unknown> = {};
    try {
      existing = JSON.parse(company?.settings ?? "{}");
    } catch { /* */ }

    const merged = { ...existing, ...patch };

    await db
      .update(companiesTable)
      .set({ settings: JSON.stringify(merged), updatedAt: new Date() })
      .where(eq(companiesTable.id, companyId));

    res.json(merged);
  },
);

export default router;
