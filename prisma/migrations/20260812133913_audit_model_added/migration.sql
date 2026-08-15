-- AlterTable
ALTER TABLE "Subscriptions" ALTER COLUMN "stripeCustomerId" DROP NOT NULL,
ALTER COLUMN "stripeSubscriptionId" DROP NOT NULL,
ALTER COLUMN "stripePriceId" DROP NOT NULL,
ALTER COLUMN "planName" DROP NOT NULL,
ALTER COLUMN "currentPeriodStart" DROP NOT NULL,
ALTER COLUMN "currentPeriodEnd" DROP NOT NULL,
ALTER COLUMN "trialEnd" DROP NOT NULL;
