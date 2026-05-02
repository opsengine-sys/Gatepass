import { Router } from "express";
import { db } from "@workspace/db";
import {
  companiesTable,
  usersTable,
  officesTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";

const router = Router();

// POST /api/onboard — self-serve: create company + first office, assign caller as admin
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.appUser!.id;
  const { companyName, officeName, officeCity } = req.body as {
    companyName?: string;
    officeName?: string;
    officeCity?: string;
  };

  if (!companyName?.trim()) {
    res.status(400).json({ error: "companyName is required" });
    return;
  }

  // Build a slug from the company name
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  // Check if slug already taken
  const [existing] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.slug, slug))
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "A company with a similar name already exists. Please choose a different name." });
    return;
  }

  // Create company
  const [company] = await db
    .insert(companiesTable)
    .values({ name: companyName.trim(), slug, plan: "starter" })
    .returning();

  // Create first office
  const oName = officeName?.trim() || `${companyName.trim()} HQ`;
  const oCity = officeCity?.trim() || "City";

  const [office] = await db
    .insert(officesTable)
    .values({ companyId: company.id, name: oName, city: oCity })
    .returning();

  // Assign user as admin of this company + office
  const [updated] = await db
    .update(usersTable)
    .set({
      companyId: company.id,
      officeId: office.id,
      role: "admin",
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, userId))
    .returning();

  res.status(201).json({ user: updated, company, office });
});

export default router;
