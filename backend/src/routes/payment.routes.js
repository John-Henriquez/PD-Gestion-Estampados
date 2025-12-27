import { Router } from "express";
import { createPreference, verifyPayment, receiveWebhook } from "../controllers/payment.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.post("/create-preference", authenticateJwt, createPreference);
router.post("/verify-payment", verifyPayment); 
router.post("/webhook", receiveWebhook);

export default router;