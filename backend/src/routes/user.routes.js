"use strict";
import { Router } from "express";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import {
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from "../controllers/user.controller.js";

const router = Router();

router.use(authenticateJwt);

router
  .get("/", getUsers)
  .get("/detail/", getUser)
  .patch("/detail/", updateUser, isAdmin)
  .delete("/detail/", deleteUser, isAdmin);

export default router;
