import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.ts";
import {
  placeOrderHandler,
  getOrderHandler,
  getUserOrdersHandler,
} from "../controllers/orders.ts"
import { orderRateLimiter, readRateLimiter } from "../middlewares/index.js";


const router: Router = Router();
router.use(authMiddleware);

/**
 * POST /orders
 * Place a new order (protected - requires auth)
 */

router.post("/",orderRateLimiter,placeOrderHandler)

/**
 * GET /orders/:orderId
 * Get single order by ID (protected)
 */

router.post('/:orderId',readRateLimiter,getOrderHandler);


/**
 * GET /orders
 * List user's orders (protected)
 */

router.get('/',readRateLimiter,getUserOrdersHandler);


export default router;