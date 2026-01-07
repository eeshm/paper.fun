import { Router } from "express";
import { getNonce, login, logout } from "../controllers/auth.ts";
import { authMiddleware } from "../middlewares/auth.ts";
import { authRateLimiter, validateQuery,validateBody } from "../middlewares/index.ts";
import { getNonceSchema, loginSchema } from "../schemas/index.ts";

const router: Router = Router();
/**
 * Public endpoints (no auth required)
 */
router.use(authRateLimiter);

router.post("/nonce", validateQuery(getNonceSchema), getNonce);

router.post("/login", validateBody(loginSchema), login);
/**
 * Protected endpoints (auth required)
 */
router.post("/logout", authMiddleware, logout);

export default router;
