import express from "express";
import { uploadMiddleware } from "../middlewares/uploadMiddleware.js";
import { uploadController } from "../controllers/upload.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";

const router = express.Router();

router.post(
  "/stamp-image",
  authenticateJwt,
  uploadMiddleware.singleStampImage,
  uploadController.uploadStampImage,
);

router.post(
  "/product-images/batch",
  authenticateJwt,
  isAdmin,
  uploadMiddleware.arrayProductImages,
  uploadController.uploadMultipleProductImages,
);

export default router;
