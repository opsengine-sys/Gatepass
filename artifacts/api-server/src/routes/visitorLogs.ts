import { Router } from "express";
import { db } from "@workspace/db";
import { visitorLogsTable } from "@workspace/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";

const router = Router();

function dayBounds(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// GET /api/visitor-logs
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { officeId, date } = req.query as Record<string, string>;
  const companyId = req.appUser!.companyId;

  if (!companyId || !officeId) {
    res.json([]);
    return;
  }

  const { start, end } = dayBounds(date);

  const logs = await db
    .select()
    .from(visitorLogsTable)
    .where(
      and(
        eq(visitorLogsTable.companyId, companyId),
        eq(visitorLogsTable.officeId, officeId),
        gte(visitorLogsTable.ts, start),
        lte(visitorLogsTable.ts, end),
      ),
    )
    .orderBy(desc(visitorLogsTable.ts));

  res.json(logs);
});

export default router;
