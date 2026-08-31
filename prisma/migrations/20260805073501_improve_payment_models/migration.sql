/*
  Warnings:

  - You are about to drop the `paymentGateway` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "paymentGateway";

-- CreateTable
CREATE TABLE "PaymentGateway" (
    "id" SERIAL NOT NULL,
    "stripePublishableKey" TEXT NOT NULL DEFAULT '',
    "stripeSecretKey" TEXT NOT NULL DEFAULT '',
    "stripeMode" TEXT NOT NULL DEFAULT 'test',
    "stripeWebhookSecret" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentSuccessUrl" TEXT NOT NULL DEFAULT '',
    "paymentCancelUrl" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "PaymentGateway_pkey" PRIMARY KEY ("id")
);
