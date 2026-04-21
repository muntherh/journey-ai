import { Router, type IRouter } from "express";
import healthRouter from "./health";
import journeysRouter from "./journeys";
import tasksRouter from "./tasks";
import coachRouter from "./coach";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(journeysRouter);
router.use(tasksRouter);
router.use(coachRouter);
router.use(dashboardRouter);

export default router;
