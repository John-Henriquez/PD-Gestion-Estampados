import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { uploadMiddleware } from "./../middlewares/uploadMiddleware.js";
import { itemTypeController } from "../controllers/itemType.controller.js";

const router = Router();

router.use(authenticateJwt);

router.get("/", itemTypeController.getItemTypes);
router.get("/deleted", isAdmin, itemTypeController.getDeletedItemTypes);
router.get("/:id", itemTypeController.getItemTypeById);

router.delete("/force/:id", isAdmin, itemTypeController.forceDeleteItemType);
router.delete("/trash/empty", isAdmin, itemTypeController.emptyTrash);
router.patch("/restore/:id", isAdmin, itemTypeController.restoreItemType);

router.post(
  "/",
  isAdmin,
  uploadMiddleware.singleBaseImage,
  itemTypeController.createItemType,
);
router.patch(
  "/:id",
  isAdmin,
  uploadMiddleware.singleBaseImage,
  itemTypeController.updateItemType,
);

router.delete("/:id", isAdmin, itemTypeController.deleteItemType);

export default router;
