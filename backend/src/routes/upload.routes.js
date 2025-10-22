import express from "express";
import uploadService from "./../services/upload.service.js";
import uploadController from "./../controllers/upload.controller.js";

const router = express.Router();

router.post(
  "/upload-image",
  uploadService.uploadSingle,
  uploadController.uploadImage,
);

export default router;
