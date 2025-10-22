import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { inventoryMovementController } from "../controllers/inventoryMovement.controller.js";

const router = Router();

router.use(authenticateJwt);

router.get(
  "/report",
  isAdmin,
  inventoryMovementController.getInventoryMovements,
);

export default router;
