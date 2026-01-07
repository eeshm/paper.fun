/**
 * Export all validation schemas
 */

// Common
export {
  walletAddressSchema,
  positiveDecimalSchema,
  nonNegativeDecimalSchema,
  positiveIntSchema,
  assetSchema,
  orderSideSchema,
  symbolSchema,
} from "./common.ts";

// Auth
export {
  getNonceSchema,
  loginSchema,
  type GetNonceInput,
  type LoginInput,
} from "./auth.ts";

// Orders
export {
  placeOrderSchema,
  getOrderParamsSchema,
  listOrdersQuerySchema,
  type PlaceOrderInput,
  type GetOrderParams,
  type ListOrdersQuery,
} from "./orders.ts";

// Market
export {
  getPriceParamsSchema,
  type GetPriceParams,
} from "./market.ts";