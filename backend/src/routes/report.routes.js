"use strict";
import { Router } from "express";
import { reportController } from "../controllers/report.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";

const router = Router();

router.use(authenticateJwt);
router.use(isAdmin);

router.get("/stats", reportController.getDashboardStats);
router.get("/inventory-losses", reportController.getInventoryLossReport);

export default router;