-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('critical', 'high', 'medium', 'low', 'info');

-- CreateTable
CREATE TABLE "Audit" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "status" "AuditStatus" NOT NULL DEFAULT 'pending',
    "overallScore" INTEGER,
    "seoScore" INTEGER,
    "contentScore" INTEGER,
    "readabilityScore" INTEGER,
    "accessibilityScore" INTEGER,
    "performanceScore" INTEGER,
    "wordCount" INTEGER,
    "readingTime" INTEGER,
    "imageCount" INTEGER,
    "imagesWithoutAlt" INTEGER,
    "internalLinks" INTEGER,
    "externalLinks" INTEGER,
    "brokenLinks" INTEGER,
    "metaTitleLength" INTEGER,
    "metaDescriptionLength" INTEGER,
    "h1Count" INTEGER,
    "h2Count" INTEGER,
    "h3Count" INTEGER,
    "keywordDensity" DOUBLE PRECISION,
    "primaryKeyword" TEXT,
    "pageContent" TEXT,
    "headings" JSONB,
    "metadata" JSONB,
    "technicalData" JSONB,
    "aiAnalysis" JSONB,
    "aiModel" TEXT,
    "aiTokensUsed" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditRecommendation" (
    "id" SERIAL NOT NULL,
    "auditId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "AuditSeverity" NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Audit_organizationId_idx" ON "Audit"("organizationId");

-- CreateIndex
CREATE INDEX "Audit_createdById_idx" ON "Audit"("createdById");

-- CreateIndex
CREATE INDEX "Audit_status_idx" ON "Audit"("status");

-- CreateIndex
CREATE INDEX "Audit_createdAt_idx" ON "Audit"("createdAt");

-- CreateIndex
CREATE INDEX "AuditRecommendation_auditId_idx" ON "AuditRecommendation"("auditId");

-- CreateIndex
CREATE INDEX "AuditRecommendation_severity_idx" ON "AuditRecommendation"("severity");

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditRecommendation" ADD CONSTRAINT "AuditRecommendation_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
