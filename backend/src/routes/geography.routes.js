"use strict";
import { Router } from "express";
import { getRegions, getComunasByRegion } from "../controllers/geography.controller.js";

const router = Router();

router.get("/regions", getRegions);

router.get("/comunas/:regionId", getComunasByRegion);

export default router;