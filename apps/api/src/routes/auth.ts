import { Router } from "express";
import { getNonce, login, logout } from "../controllers/auth.js";
import { authMiddleware } from "../middlewares/auth.js";
import { authRateLimiter, validateBody } from "../middlewares/index.js";
import { getNonceSchema, loginSchema } from "../schemas/index.js";

const router: Router = Router();
/**
 * Public endpoints (no auth required)
 */
router.use(authRateLimiter);

router.post("/nonce", validateBody(getNonceSchema), getNonce);

router.post("/login", validateBody(loginSchema), login);
/**
 * Protected endpoints (auth required)
 */
router.post("/logout", authMiddleware, logout);

export default router;
