import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { packController } from "../controllers/pack.controller.js";

const router = Router();

router.use(authenticateJwt);

router.delete("/trash", isAdmin, packController.emptyTrash);
router.patch("/restore/:id", isAdmin, packController.restorePack);
router.delete("/force-delete/:id", isAdmin, packController.forceDeletePack);

router.get("/", packController.getPacks);
router.get("/:id", packController.getPackById);
router.post("/", isAdmin, packController.createPack);
router.patch("/:id", isAdmin, packController.updatePack);
router.delete("/:id", isAdmin, packController.deletePack);

export default router;
