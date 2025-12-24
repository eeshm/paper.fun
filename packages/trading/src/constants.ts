/**
 * Trading Constants
 * Centralized values for validation and state management
 */

export const ORDER_STATUS = {
    PENDING: "pending",
    FILLED: "filled",
    REJECTED: "rejected",
} as const;


export const ORDER_SIDE= {
    BUY: "buy",
    SELL: "sell",
} as const;

export const ORDER_TYPE = {
    MARKET: "market",
} as const;
