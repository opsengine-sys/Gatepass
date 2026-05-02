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

/** Fetch real name + email from Clerk REST API using the secret key */
async function fetchClerkUserData(clerkId: string): Promise<{ name: string; email: string } | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;

  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!res.ok) return null;

    const data = await res.json() as {
      first_name?: string | null;
      last_name?: string | null;
      email_addresses?: Array<{ id: string; email_address: string }>;
      primary_email_address_id?: string | null;
    };

    const firstName = data.first_name ?? "";
    const lastName = data.last_name ?? "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

    const primaryEmail = data.email_addresses?.find(
      (e) => e.id === data.primary_email_address_id,
    );
    const email = primaryEmail?.email_address ?? null;

    // Build a display name: full name, or email local-part, or null
    const name = fullName || (email ? email.split("@")[0] : null);

    return { name: name ?? "User", email: email ?? "" };
  } catch {
    return null;
  }
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
    // Refresh name/email from Clerk if still showing placeholders
    const needsRefresh =
      existing.name === "New User" ||
      existing.name === "User" ||
      existing.email.endsWith("@unknown.com") ||
      existing.email === "";

    if (needsRefresh) {
      const clerkData = await fetchClerkUserData(clerkId);
      if (clerkData) {
        const freshName = clerkData.name || existing.name;
        const freshEmail = clerkData.email || existing.email;
        if (freshName !== existing.name || freshEmail !== existing.email) {
          await db
            .update(usersTable)
            .set({ name: freshName, email: freshEmail, updatedAt: new Date() })
            .where(eq(usersTable.id, existing.id));
        }
      }
    }

    const user = await getUserWithRelations(existing.id);
    res.json(user);
    return;
  }

  // Auto-create user record on first sign-in
  const clerkData = await fetchClerkUserData(clerkId);
  const name = clerkData?.name ?? "User";
  const email = clerkData?.email ?? `${clerkId}@unknown.com`;

  const [newUser] = await db
    .insert(usersTable)
    .values({ clerkId, name, email, role: "viewer" })
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
