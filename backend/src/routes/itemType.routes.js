import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import upload from "./../middlewares/uploadMiddleware.js";
import { itemTypeController } from "../controllers/itemType.controller.js";

const router = Router();

router.use(authenticateJwt);

router.get("/", itemTypeController.getItemTypes);

router.get("/deleted", isAdmin, itemTypeController.getDeletedItemTypes);
router.delete("/force/:id", isAdmin, itemTypeController.forceDeleteItemType);
router.delete("/trash/empty", isAdmin, itemTypeController.emptyTrash);
router.patch("/restore/:id", isAdmin, itemTypeController.restoreItemType);

router.get("/:id", itemTypeController.getItemTypeById);
router.post(
  "/",
  isAdmin,
  upload.single("baseImage"),
  itemTypeController.createItemType,
);
router.patch(
  "/:id",
  isAdmin,
  upload.single("baseImage"),
  itemTypeController.updateItemType,
);
router.delete("/:id", isAdmin, itemTypeController.deleteItemType);

export default router;
