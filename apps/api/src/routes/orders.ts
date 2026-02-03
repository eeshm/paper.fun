import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import {
  placeOrderHandler,
  getOrderHandler,
  getUserOrdersHandler,
} from "../controllers/orders.js";
import {
  orderRateLimiter,
  readRateLimiter,
  validateBody,
  validateParams,
  validateQuery,
} from "../middlewares/index.js";
import {
  placeOrderSchema,
  getOrderParamsSchema,
  listOrdersQuerySchema,
} from "../schemas/index.js";

const router: Router = Router()

;
router.use(authMiddleware);
/**
 * POST /orders
 * Place a new order (protected - requires auth)
 */

router.post(
  "/",
  orderRateLimiter,
  validateBody(placeOrderSchema),
  placeOrderHandler
);

/**
 * GET /orders/:orderId
 * Get single order by ID (protected)
 */

router.get(
  "/:orderId",
  readRateLimiter,
  validateParams(getOrderParamsSchema),
  getOrderHandler
);

/**
 * GET /orders
 * List user's orders (protected)
 */

router.get(
  "/",
  readRateLimiter,
  validateQuery(listOrdersQuerySchema),
  getUserOrdersHandler
);

export default router;
