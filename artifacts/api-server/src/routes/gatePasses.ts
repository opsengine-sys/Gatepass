import { Router } from "express";
import { db } from "@workspace/db";
import {
  gatePassesTable,
  gpLogsTable,
  officesTable,
} from "@workspace/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";
import { generatePassId } from "../lib/ids";

const router = Router();

function dayBounds(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// GET /api/gate-passes
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { officeId, status, date } = req.query as Record<string, string>;
  const companyId = req.appUser!.companyId;

  if (!companyId || !officeId) {
    res.json([]);
    return;
  }

  const conditions = [
    eq(gatePassesTable.companyId, companyId),
    eq(gatePassesTable.officeId, officeId),
  ];

  if (status) {
    conditions.push(
      eq(gatePassesTable.status, status as typeof gatePassesTable.$inferSelect["status"]),
    );
  }

  if (date) {
    const { start, end } = dayBounds(date);
    conditions.push(gte(gatePassesTable.openedAt, start));
    conditions.push(lte(gatePassesTable.openedAt, end));
  }

  const passes = await db
    .select()
    .from(gatePassesTable)
    .where(and(...conditions))
    .orderBy(desc(gatePassesTable.openedAt));

  res.json(passes);
});

// POST /api/gate-passes
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const companyId = req.appUser!.companyId;
  if (!companyId) {
    res.status(400).json({ error: "User has no company assigned" });
    return;
  }

  const {
    officeId,
    purpose,
    type,
    vendorName,
    vehicleNo,
    driverName,
    requestedBy,
    items,
    notes,
  } = req.body;

  if (!officeId || !purpose || !type || !requestedBy) {
    res
      .status(400)
      .json({ error: "officeId, purpose, type, requestedBy are required" });
    return;
  }

  const [office] = await db
    .select()
    .from(officesTable)
    .where(and(eq(officesTable.id, officeId), eq(officesTable.companyId, companyId)))
    .limit(1);

  if (!office) {
    res.status(404).json({ error: "Office not found" });
    return;
  }

  const passId = generatePassId();
  const safeItems = Array.isArray(items) ? items : [];

  const [pass] = await db
    .insert(gatePassesTable)
    .values({
      companyId,
      officeId,
      passId,
      purpose,
      type,
      vendorName: vendorName ?? null,
      vehicleNo: vehicleNo ?? null,
      driverName: driverName ?? null,
      requestedBy,
      requestedById: req.appUser!.id,
      items: safeItems,
      itemCount: safeItems.length,
      notes: notes ?? null,
    })
    .returning();

  await db.insert(gpLogsTable).values({
    passId: pass.passId,
    gatePassId: pass.id,
    companyId,
    officeId,
    type: "opened",
    by: requestedBy,
    note: `Gate pass created for: ${purpose}`,
  });

  res.status(201).json(pass);
});

// POST /api/gate-passes/:gpId/close
router.post(
  "/:gpId/close",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const gpId = req.params["gpId"] as string;
    const companyId = req.appUser!.companyId as string;

    const [pass] = await db
      .select()
      .from(gatePassesTable)
      .where(
        and(
          eq(gatePassesTable.id, gpId),
          eq(gatePassesTable.companyId, companyId),
        ),
      )
      .limit(1);

    if (!pass) {
      res.status(404).json({ error: "Gate pass not found" });
      return;
    }

    const [updated] = await db
      .update(gatePassesTable)
      .set({ status: "Closed", closedAt: new Date() })
      .where(eq(gatePassesTable.id, gpId))
      .returning();

    await db.insert(gpLogsTable).values({
      passId: pass.passId,
      gatePassId: pass.id,
      companyId,
      officeId: pass.officeId,
      type: "closed",
      by: req.appUser!.name,
      note: "Gate pass closed",
    });

    res.json(updated);
  },
);

export default router;
