"use strict";
import { Router } from "express";
import {
  authenticateJwt,
  optionalAuth,
} from "../middlewares/authentication.middleware.js";
import { orderController } from "../controllers/order.controller.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";

const router = Router();

router.post("/", optionalAuth, orderController.createOrder);

router.use(authenticateJwt);

router.get("/", orderController.getMyOrders);

// router.get("/all", isAdmin, orderController.getAllOrders);
// router.get("/:id", isAdmin, orderController.getOrderById);

export default router;
