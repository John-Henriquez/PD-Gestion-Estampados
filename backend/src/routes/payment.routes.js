import { Router } from "express";
import { createPreference, verifyPayment } from "../controllers/payment.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.post("/create-preference", authenticateJwt, createPreference);
router.post("/verify-payment", verifyPayment); 

export default router;