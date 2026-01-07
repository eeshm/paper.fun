import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.ts";
import { getPortfolioHandler } from "../controllers/portfolio.ts";
import { readRateLimiter, validateQuery } from "../middlewares/index.ts";

const router: Router = Router();
router.use(authMiddleware);

/**
 * GET /portfolio
 * Get user's portfolio (balances, positions, open orders)
 * Protected - requires auth
 */

router.get("/", readRateLimiter, getPortfolioHandler);

export default router;
