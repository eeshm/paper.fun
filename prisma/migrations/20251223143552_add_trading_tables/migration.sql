-- CreateTable
CREATE TABLE "balances" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "asset" VARCHAR(20) NOT NULL,
    "available" DECIMAL(20,8) NOT NULL,
    "locked" DECIMAL(20,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "side" VARCHAR(10) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "baseAsset" VARCHAR(20) NOT NULL,
    "quoteAsset" VARCHAR(20) NOT NULL,
    "requestedSize" DECIMAL(20,8) NOT NULL,
    "priceAtOrderTime" DECIMAL(20,8) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "feesApplied" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "rejectionReason" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "side" VARCHAR(10) NOT NULL,
    "executedPrice" DECIMAL(20,8) NOT NULL,
    "executedSize" DECIMAL(20,8) NOT NULL,
    "fee" DECIMAL(20,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "asset" VARCHAR(20) NOT NULL,
    "size" DECIMAL(20,8) NOT NULL,
    "avgEntryPrice" DECIMAL(20,8) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "balances_userId_idx" ON "balances"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "balances_userId_asset_key" ON "balances"("userId", "asset");

-- CreateIndex
CREATE INDEX "orders_userId_createdAt_idx" ON "orders"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_baseAsset_idx" ON "orders"("baseAsset");

-- CreateIndex
CREATE INDEX "trades_userId_createdAt_idx" ON "trades"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "trades_orderId_idx" ON "trades"("orderId");

-- CreateIndex
CREATE INDEX "trades_side_idx" ON "trades"("side");

-- CreateIndex
CREATE INDEX "positions_userId_idx" ON "positions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "positions_userId_asset_key" ON "positions"("userId", "asset");

-- AddForeignKey
ALTER TABLE "balances" ADD CONSTRAINT "balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
