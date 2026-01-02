/**
 * Trading Module
 * Main barrel export for all trading functionality
 */

// Constants
export { ORDER_STATUS, ORDER_SIDE, ORDER_TYPE, ASSETS, FEE_RATE, INITIAL_BALANCE } from './constants.js';

// Validation
export {
  validateOrderInput,
  validateTradeExecution,
  validateBalance,
} from './validation.js';

// Fees
export { calculateFee, validateFee } from './fees.js';

// Positions
export { initPosition, updatePosition } from './positions.js';

// Orders (market orders execute immediately, no pending state)
export { placeOrder, getOrder, getUserOrders } from './orders.js';

// Portfolio
export { initPortfolio, getPortfolio } from './portfolio.js';

// NOTE: fills.ts is deprecated. Market orders now execute directly in placeOrder().
// Kept for potential future limit order support.