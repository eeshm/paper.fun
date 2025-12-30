import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.ts";
import {
  placeOrderHandler,
  getOrderHandler,
  getUserOrdersHandler,
} from "../controlllers/orders.ts"

const router: Router = Router();

/**
 * POST /orders
 * Place a new order (protected - requires auth)
 */

router.post("/",authMiddleware,placeOrderHandler)

/**
 * GET /orders/:orderId
 * Get single order by ID (protected)
 */

router.post('/:orderId',authMiddleware,getOrderHandler);


/**
 * GET /orders
 * List user's orders (protected)
 */

router.get('/',authMiddleware,getUserOrdersHandler);


export default router;