import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { fileController } from "../controllers/file.controller.js";

const router = Router();

router.use(authenticateJwt);
router.use(isAdmin);

router.get("/gallery", fileController.getGallery);
router.delete("/:filename", fileController.deleteFile);
router.patch("/rename", fileController.renameFile);
router.get("/download-zip/:orderId", fileController.downloadOrderImages);

export default router;