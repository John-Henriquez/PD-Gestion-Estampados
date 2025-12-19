import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { itemStockController } from "../controllers/itemStock.controller.js";

const router = Router();

router.get("/public", itemStockController.getPublicStock);
router.get("/public/:id", itemStockController.getPublicStockById);

router.use(authenticateJwt);

router.delete("/trash", isAdmin, itemStockController.emptyTrash);
router.patch("/restore/:id", isAdmin, itemStockController.restoreItemStock);
router.delete(
  "/force-delete/:id",
  isAdmin,
  itemStockController.forceDeleteItemStock,
);
router.post("/restock", isAdmin, itemStockController.restockVariants);

router.get("/", itemStockController.getItemStock);
router.post("/", isAdmin, itemStockController.createItemStock);
router.patch("/:id", isAdmin, itemStockController.updateItemStock);
router.delete("/:id", isAdmin, itemStockController.deleteItemStock);

router.patch("/adjust/:id/add", isAdmin, itemStockController.addStock);
router.patch("/adjust/:id/remove", isAdmin, itemStockController.removeStock);

export default router;
