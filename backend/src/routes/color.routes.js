"use strict";
import { Router } from "express";
import { colorController } from "../controllers/color.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();
router.get("/", colorController.getColors);
export default router;
