-- CreateTable
CREATE TABLE "candles" (
    "id" SERIAL NOT NULL,
    "asset" VARCHAR(20) NOT NULL,
    "timeframe" VARCHAR(10) NOT NULL,
    "bucket_start" TIMESTAMP(3) NOT NULL,
    "open" DECIMAL(20,8) NOT NULL,
    "high" DECIMAL(20,8) NOT NULL,
    "low" DECIMAL(20,8) NOT NULL,
    "close" DECIMAL(20,8) NOT NULL,
    "volume" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candles_asset_timeframe_bucket_start_idx" ON "candles"("asset", "timeframe", "bucket_start");

-- CreateIndex
CREATE UNIQUE INDEX "candles_asset_timeframe_bucket_start_key" ON "candles"("asset", "timeframe", "bucket_start");
