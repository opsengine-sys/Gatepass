import { Router } from "express";
import { db } from "@workspace/db";
import {
  visitorsTable,
  visitorLogsTable,
  companiesTable,
  officesTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { generateVisitorId } from "../lib/ids";

const router = Router();

// POST /api/public/register — visitor pre-registration (no auth)
router.post("/register", async (req, res) => {
  const {
    companySlug,
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
  } = req.body;

  if (!companySlug || !officeId || !name || !host || !type) {
    res
      .status(400)
      .json({ error: "companySlug, officeId, name, host, type are required" });
    return;
  }

  const [dbCompany] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.slug, companySlug))
    .limit(1);

  if (!dbCompany) {
    res.status(404).json({ error: "Company not found" });
    return;
  }

  const [office] = await db
    .select()
    .from(officesTable)
    .where(
      and(
        eq(officesTable.id, officeId),
        eq(officesTable.companyId, dbCompany.id),
      ),
    )
    .limit(1);

  if (!office) {
    res.status(404).json({ error: "Office not found" });
    return;
  }

  const visitorId = generateVisitorId();

  const [visitor] = await db
    .insert(visitorsTable)
    .values({
      companyId: dbCompany.id,
      officeId,
      visitorId,
      name,
      phone: phone ?? null,
      email: email ?? null,
      company: company ?? null,
      host,
      type,
      status: "Pending",
      purpose: purpose ?? null,
      idType: idType ?? null,
      idNumber: idNumber ?? null,
      photoUrl: photoUrl ?? null,
      vehicleNumber: vehicleNumber ?? null,
    })
    .returning();

  await db.insert(visitorLogsTable).values({
    visitorId: visitor.id,
    vid: visitor.visitorId,
    name: visitor.name,
    companyId: dbCompany.id,
    officeId,
    action: "pre-registered",
    note: "Self-registered via visitor link",
  });

  res.status(201).json(visitor);
});

export default router;
