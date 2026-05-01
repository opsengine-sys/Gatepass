import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, companiesTable, officesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";

const router = Router();

async function getUserWithRelations(userId: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) return null;

  let company = null;
  let office = null;

  if (user.companyId) {
    const [c] = await db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.id, user.companyId))
      .limit(1);
    company = c ?? null;
  }

  if (user.officeId) {
    const [o] = await db
      .select()
      .from(officesTable)
      .where(eq(officesTable.id, user.officeId))
      .limit(1);
    office = o ?? null;
  }

  return { ...user, company, office };
}

// GET /api/me — get or auto-create user on first sign-in
router.get("/me", async (req: AuthenticatedRequest, res) => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;

  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);

  if (existing) {
    const user = await getUserWithRelations(existing.id);
    res.json(user);
    return;
  }

  // Auto-create user record on first sign-in
  const clerkUser = auth?.sessionClaims;
  const name =
    (clerkUser?.["firstName"] as string ?? "") +
    " " +
    (clerkUser?.["lastName"] as string ?? "");
  const email = (clerkUser?.["email"] as string) ?? `${clerkId}@unknown.com`;

  const [newUser] = await db
    .insert(usersTable)
    .values({
      clerkId,
      name: name.trim() || "New User",
      email,
      role: "viewer",
    })
    .returning();

  res.json({ ...newUser, company: null, office: null });
});

// PATCH /api/me
router.patch("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { name, officeId } = req.body;
  const userId = req.appUser!.id;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name) updates.name = name;
  if (officeId !== undefined) updates.officeId = officeId;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning();

  const user = await getUserWithRelations(updated.id);
  res.json(user);
});

export default router;
