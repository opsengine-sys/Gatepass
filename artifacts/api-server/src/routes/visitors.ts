import { Router } from "express";
import { db } from "@workspace/db";
import {
  visitorsTable,
  visitorLogsTable,
  officesTable,
} from "@workspace/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";
import { generateVisitorId } from "../lib/ids";

const router = Router();

function dayBounds(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function logVisitorEvent(
  visitorId: string,
  vid: string,
  name: string,
  companyId: string,
  officeId: string,
  action: string,
  note?: string,
) {
  await db.insert(visitorLogsTable).values({
    visitorId,
    vid,
    name,
    companyId,
    officeId,
    action,
    note: note ?? null,
  });
}

// GET /api/visitors
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { officeId, date, status } = req.query as Record<string, string>;
  const companyId = req.appUser!.companyId;

  if (!companyId || !officeId) {
    res.json([]);
    return;
  }

  const { start, end } = dayBounds(date);

  const conditions = [
    eq(visitorsTable.companyId, companyId),
    eq(visitorsTable.officeId, officeId),
    gte(visitorsTable.createdAt, start),
    lte(visitorsTable.createdAt, end),
  ];

  if (status) {
    conditions.push(
      eq(visitorsTable.status, status as typeof visitorsTable.$inferSelect["status"]),
    );
  }

  const visitors = await db
    .select()
    .from(visitorsTable)
    .where(and(...conditions))
    .orderBy(visitorsTable.createdAt);

  res.json(visitors);
});

// POST /api/visitors
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const companyId = req.appUser!.companyId;
  if (!companyId) {
    res.status(400).json({ error: "User has no company assigned" });
    return;
  }

  const {
    officeId,
    name,
    phone,
    email,
    company,
    host,
    type,
    purpose,
    idType,
    idNumber,
    photoUrl,
    vehicleNumber,
    checkInNow,
  } = req.body;

  if (!officeId || !name || !host || !type) {
    res.status(400).json({ error: "officeId, name, host, type are required" });
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

  const visitorId = generateVisitorId();
  const status = checkInNow ? "Checked In" : "Pending";
  const checkInTime = checkInNow ? new Date() : null;

  const [visitor] = await db
    .insert(visitorsTable)
    .values({
      companyId,
      officeId,
      visitorId,
      name,
      phone: phone ?? null,
      email: email ?? null,
      company: company ?? null,
      host,
      type,
      status,
      purpose: purpose ?? null,
      idType: idType ?? null,
      idNumber: idNumber ?? null,
      photoUrl: photoUrl ?? null,
      vehicleNumber: vehicleNumber ?? null,
      checkInTime,
    })
    .returning();

  await logVisitorEvent(
    visitor.id,
    visitor.visitorId,
    visitor.name,
    companyId,
    officeId,
    checkInNow ? "checked in" : "registered",
    checkInNow ? "Checked in" : "Registered",
  );

  res.status(201).json(visitor);
});

// POST /api/visitors/:visitorId/checkin
router.post(
  "/:visitorId/checkin",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const visitorId = req.params["visitorId"] as string;
    const companyId = req.appUser!.companyId as string;

    const [visitor] = await db
      .select()
      .from(visitorsTable)
      .where(
        and(
          eq(visitorsTable.id, visitorId),
          eq(visitorsTable.companyId, companyId),
        ),
      )
      .limit(1);

    if (!visitor) {
      res.status(404).json({ error: "Visitor not found" });
      return;
    }

    const [updated] = await db
      .update(visitorsTable)
      .set({
        status: "Checked In",
        checkInTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(visitorsTable.id, visitorId))
      .returning();

    await logVisitorEvent(
      visitor.id,
      visitor.visitorId,
      visitor.name,
      companyId,
      visitor.officeId,
      "checked in",
      "Checked in",
    );

    res.json(updated);
  },
);

// POST /api/visitors/:visitorId/checkout
router.post(
  "/:visitorId/checkout",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const visitorId = req.params["visitorId"] as string;
    const companyId = req.appUser!.companyId as string;

    const [visitor] = await db
      .select()
      .from(visitorsTable)
      .where(
        and(
          eq(visitorsTable.id, visitorId),
          eq(visitorsTable.companyId, companyId),
        ),
      )
      .limit(1);

    if (!visitor) {
      res.status(404).json({ error: "Visitor not found" });
      return;
    }

    const [updated] = await db
      .update(visitorsTable)
      .set({
        status: "Checked Out",
        checkOutTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(visitorsTable.id, visitorId))
      .returning();

    await logVisitorEvent(
      visitor.id,
      visitor.visitorId,
      visitor.name,
      companyId,
      visitor.officeId,
      "checked out",
      "Checked out",
    );

    res.json(updated);
  },
);

// POST /api/visitors/:visitorId/break
router.post(
  "/:visitorId/break",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const visitorId = req.params["visitorId"] as string;
    const companyId = req.appUser!.companyId as string;

    const [visitor] = await db
      .select()
      .from(visitorsTable)
      .where(
        and(
          eq(visitorsTable.id, visitorId),
          eq(visitorsTable.companyId, companyId),
        ),
      )
      .limit(1);

    if (!visitor) {
      res.status(404).json({ error: "Visitor not found" });
      return;
    }

    const [updated] = await db
      .update(visitorsTable)
      .set({ status: "On Break", updatedAt: new Date() })
      .where(eq(visitorsTable.id, visitorId))
      .returning();

    await logVisitorEvent(
      visitor.id,
      visitor.visitorId,
      visitor.name,
      companyId,
      visitor.officeId,
      "stepped out",
      "Step out — still checked in",
    );

    res.json(updated);
  },
);

// POST /api/visitors/:visitorId/return
router.post(
  "/:visitorId/return",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const visitorId = req.params["visitorId"] as string;
    const companyId = req.appUser!.companyId as string;

    const [visitor] = await db
      .select()
      .from(visitorsTable)
      .where(
        and(
          eq(visitorsTable.id, visitorId),
          eq(visitorsTable.companyId, companyId),
        ),
      )
      .limit(1);

    if (!visitor) {
      res.status(404).json({ error: "Visitor not found" });
      return;
    }

    const [updated] = await db
      .update(visitorsTable)
      .set({ status: "Checked In", updatedAt: new Date() })
      .where(eq(visitorsTable.id, visitorId))
      .returning();

    await logVisitorEvent(
      visitor.id,
      visitor.visitorId,
      visitor.name,
      companyId,
      visitor.officeId,
      "returned",
      "Returned from step out",
    );

    res.json(updated);
  },
);

export default router;
