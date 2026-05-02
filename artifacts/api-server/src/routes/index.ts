import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import officesRouter from "./offices";
import usersRouter from "./users";
import visitorsRouter from "./visitors";
import visitorLogsRouter from "./visitorLogs";
import gatePassesRouter from "./gatePasses";
import gpLogsRouter from "./gpLogs";
import adminRouter from "./admin";
import publicRouter from "./publicRoutes";
import onboardRouter from "./onboard";
import auditLogsRouter from "./auditLogs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/onboard", onboardRouter);
router.use("/offices", officesRouter);
router.use("/users", usersRouter);
router.use("/visitors", visitorsRouter);
router.use("/visitor-logs", visitorLogsRouter);
router.use("/gate-passes", gatePassesRouter);
router.use("/gp-logs", gpLogsRouter);
router.use("/admin", adminRouter);
router.use("/public", publicRouter);
router.use("/audit-logs", auditLogsRouter);

export default router;
