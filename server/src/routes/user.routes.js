import express from "express";
import { register, signin, getMe, changePassword, getSubscriptionStatus, logout } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/signin", signin);
router.get("/me", requireAuth, getMe);
router.post("/change-password", requireAuth, changePassword);
router.get("/subscription-status", requireAuth, getSubscriptionStatus);
router.post("/logout", requireAuth, logout);
export default router;
