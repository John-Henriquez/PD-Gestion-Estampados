import express from "express";
import uploadMiddleware from "../middlewares/uploadMiddleware.js";
import uploadController from "../controllers/upload.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js"; 

const router = express.Router();

router.post(
    "/stamp-image", 
    authenticateJwt, 
    uploadMiddleware.single("stampImage"), 
    uploadController.uploadImage 
 );

export default router;