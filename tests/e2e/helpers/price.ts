import { Decimal } from "decimal.js";
import { setPrice } from "@repo/pricing";

export async function setTestPrice(symbol: string, price: string | number): Promise<void> {
  // Always use 2 decimal places for consistency
  const decimal = new Decimal(price);
  const formattedPrice = decimal.toFixed(2);
  await setPrice(symbol, new Decimal(formattedPrice));
}
