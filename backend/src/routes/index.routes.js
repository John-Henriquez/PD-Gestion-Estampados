"use strict";
import { Router } from "express";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import itemTypeRoutes from "./itemType.routes.js";
import itemStockRoutes from "./itemStock.routes.js";
import packRoutes from "./pack.routes.js";
import inventoryMovementRoutes from "./inventoryMovement.routes.js";
import orderRoutes from "./order.routes.js";
import uploadRoutes from "./upload.routes.js";
//import sendMail from "./email.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);

router.use("/item-types", itemTypeRoutes);
router.use("/item-stocks", itemStockRoutes);
router.use("/packs", packRoutes);
// router.use("/sendMail", sendMail);
router.use("/reports/inventory-movements", inventoryMovementRoutes);

router.use("/orders", orderRoutes);
router.use("/uploads", uploadRoutes);

export default router;
