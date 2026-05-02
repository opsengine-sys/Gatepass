import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";

const router = Router();

// ─── GET /api/audit-logs ─────────────────────────────────────────────────────
// Company admins see their own company's logs.
router.get("/", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { companyId, role } = authReq.appUser!;

  try {
    let rows;
    if (role === "super_admin") {
      const filterCompanyId = req.query.companyId as string | undefined;
      if (filterCompanyId) {
        rows = await db
          .select()
          .from(auditLogsTable)
          .where(eq(auditLogsTable.companyId, filterCompanyId))
          .orderBy(desc(auditLogsTable.createdAt))
          .limit(200);
      } else {
        rows = await db
          .select()
          .from(auditLogsTable)
          .orderBy(desc(auditLogsTable.createdAt))
          .limit(200);
      }
    } else {
      if (!companyId) {
        res.json([]);
        return;
      }
      rows = await db
        .select()
        .from(auditLogsTable)
        .where(eq(auditLogsTable.companyId, companyId))
        .orderBy(desc(auditLogsTable.createdAt))
        .limit(200);
    }

    res.json(rows);
  } catch (err) {
    req.log?.error({ err }, "Failed to fetch audit logs");
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// ─── POST /api/audit-logs ─────────────────────────────────────────────────────
// Create an audit log entry. Any authenticated user can log actions in their own company.
router.post("/", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const appUser = authReq.appUser!;
  const companyId = appUser.companyId;
  const actorName = appUser.name;
  const actorEmail = appUser.email;

  const { action, entity, entityId, entityLabel, details } = req.body as {
    action: string;
    entity: string;
    entityId?: string;
    entityLabel?: string;
    details?: Record<string, unknown>;
  };

  if (!action || !entity) {
    res.status(400).json({ error: "action and entity are required" });
    return;
  }

  try {
    const [row] = await db
      .insert(auditLogsTable)
      .values({
        companyId: companyId ?? null,
        userId: appUser.id ?? null,
        actorName: actorName ?? null,
        actorEmail: actorEmail ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        entityLabel: entityLabel ?? null,
        details: details ? JSON.stringify(details) : null,
      })
      .returning();

    res.status(201).json(row);
  } catch (err) {
    req.log?.error({ err }, "Failed to create audit log");
    res.status(500).json({ error: "Failed to create audit log" });
  }
});

// ─── DELETE /api/audit-logs (super admin only) ───────────────────────────────
router.delete("/", requireAuth, requireSuperAdmin, async (req, res) => {
  const { companyId } = req.query as { companyId?: string };
  try {
    if (companyId) {
      await db.delete(auditLogsTable).where(eq(auditLogsTable.companyId, companyId));
    } else {
      await db.delete(auditLogsTable);
    }
    res.json({ ok: true });
  } catch (err) {
    req.log?.error({ err }, "Failed to delete audit logs");
    res.status(500).json({ error: "Failed to delete audit logs" });
  }
});

export default router;
