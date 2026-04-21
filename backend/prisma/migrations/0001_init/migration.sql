-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'STAFF', 'ADMIN', 'DOCTOR', 'OPERATOR');
CREATE TYPE "MarketingLeadStage" AS ENUM ('NEW', 'QUALIFIED', 'DEMO_SCHEDULED', 'TRIAL', 'WON', 'LOST');
CREATE TYPE "SiteStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "LeadStage" AS ENUM ('NEW', 'QUALIFIED', 'SCHEDULED', 'ATTENDED', 'RECURRING', 'LOST');
CREATE TYPE "AdChannel" AS ENUM ('META', 'GOOGLE', 'TIKTOK', 'YOUTUBE');
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED');
CREATE TYPE "FollowupChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'SMS');
CREATE TYPE "FollowupStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELED');
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'ATTENDED', 'NO_SHOW', 'CANCELED');
CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'CONTACTED', 'BOOKED', 'DISMISSED');

-- User
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'DOCTOR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- MarketingLead
CREATE TABLE "MarketingLead" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "specialty" TEXT,
  "city" TEXT,
  "state" TEXT,
  "source" TEXT NOT NULL DEFAULT 'organic',
  "utm" JSONB,
  "stage" "MarketingLeadStage" NOT NULL DEFAULT 'NEW',
  "estimatedValue" INTEGER,
  "notes" TEXT,
  "assignedTo" TEXT,
  "lastContactAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketingLead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MarketingLead_stage_idx" ON "MarketingLead"("stage");
CREATE INDEX "MarketingLead_source_idx" ON "MarketingLead"("source");

-- AuditLog
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorEmail" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "meta" JSONB,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_actorEmail_idx" ON "AuditLog"("actorEmail");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- Clinic
CREATE TABLE "Clinic" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "specialty" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "district" TEXT,
  "state" TEXT,
  "phone" TEXT,
  "instagram" TEXT,
  "website" TEXT,
  "googlePlaceId" TEXT,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Clinic" ADD CONSTRAINT "Clinic_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Diagnosis
CREATE TABLE "Diagnosis" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "specialty" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "district" TEXT,
  "score" INTEGER NOT NULL,
  "competitors" JSONB NOT NULL,
  "weaknesses" JSONB NOT NULL,
  "attackPlan" JSONB NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Briefing
CREATE TABLE "Briefing" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "doctor" JSONB NOT NULL,
  "services" JSONB NOT NULL,
  "differentials" JSONB NOT NULL,
  "media" JSONB NOT NULL,
  "tone" JSONB NOT NULL,
  "goals" JSONB NOT NULL,
  "audience" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Briefing_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Briefing" ADD CONSTRAINT "Briefing_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Site
CREATE TABLE "Site" (
  "id" TEXT NOT NULL,
  "briefingId" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "html" TEXT NOT NULL,
  "status" "SiteStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Site_slug_key" ON "Site"("slug");
ALTER TABLE "Site" ADD CONSTRAINT "Site_briefingId_fkey" FOREIGN KEY ("briefingId") REFERENCES "Briefing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Site" ADD CONSTRAINT "Site_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ActionPlan
CREATE TABLE "ActionPlan" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "weeks" JSONB NOT NULL,
  "budgetSuggested" DECIMAL(12,2) NOT NULL,
  "kpis" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActionPlan_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Lead
CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "source" TEXT,
  "procedure" TEXT,
  "value" DECIMAL(12,2),
  "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
  "tags" TEXT[],
  "notes" TEXT,
  "referralCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- LeadActivity
CREATE TABLE "LeadActivity" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Campaign
CREATE TABLE "Campaign" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "channel" "AdChannel" NOT NULL,
  "objective" TEXT NOT NULL,
  "dailyBudget" DECIMAL(12,2) NOT NULL,
  "copy" JSONB NOT NULL,
  "targeting" JSONB NOT NULL,
  "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "spent" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "leadsCount" INTEGER NOT NULL DEFAULT 0,
  "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "externalId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FollowupTemplate
CREATE TABLE "FollowupTemplate" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "channel" "FollowupChannel" NOT NULL,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "delayDays" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FollowupTemplate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FollowupTemplate_code_key" ON "FollowupTemplate"("code");

-- FollowupJob
CREATE TABLE "FollowupJob" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "templateCode" TEXT NOT NULL,
  "channel" "FollowupChannel" NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "status" "FollowupStatus" NOT NULL DEFAULT 'PENDING',
  "sentAt" TIMESTAMP(3),
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FollowupJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FollowupJob_status_scheduledFor_idx" ON "FollowupJob"("status", "scheduledFor");
ALTER TABLE "FollowupJob" ADD CONSTRAINT "FollowupJob_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowupJob" ADD CONSTRAINT "FollowupJob_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Appointment
CREATE TABLE "Appointment" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "leadId" TEXT,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "procedure" TEXT,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Review
CREATE TABLE "Review" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "reply" TEXT,
  "replyDraft" TEXT,
  "postedAt" TIMESTAMP(3),
  "repliedAt" TIMESTAMP(3),
  "externalId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Review" ADD CONSTRAINT "Review_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ReturnReminder
CREATE TABLE "ReturnReminder" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "leadId" TEXT,
  "intervalMonths" INTEGER NOT NULL DEFAULT 6,
  "message" TEXT NOT NULL,
  "nextDueAt" TIMESTAMP(3) NOT NULL,
  "status" "ReturnStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReturnReminder_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ReturnReminder_status_nextDueAt_idx" ON "ReturnReminder"("status", "nextDueAt");
ALTER TABLE "ReturnReminder" ADD CONSTRAINT "ReturnReminder_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReturnReminder" ADD CONSTRAINT "ReturnReminder_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Referral
CREATE TABLE "Referral" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "referrerName" TEXT NOT NULL,
  "referrerPhone" TEXT,
  "rewardType" TEXT NOT NULL DEFAULT 'CREDIT',
  "rewardValue" DECIMAL(12,2) NOT NULL DEFAULT 100,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "rewardsPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Referral_code_key" ON "Referral"("code");
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SeoArticle
CREATE TABLE "SeoArticle" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "keyword" TEXT NOT NULL,
  "html" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SeoArticle_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SeoArticle_clinicId_slug_key" ON "SeoArticle"("clinicId", "slug");
ALTER TABLE "SeoArticle" ADD CONSTRAINT "SeoArticle_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Integration
CREATE TABLE "Integration" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "expiresAt" TIMESTAMP(3),
  "meta" JSONB,
  "status" TEXT NOT NULL DEFAULT 'CONNECTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Integration_clinicId_provider_key" ON "Integration"("clinicId", "provider");
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- WebhookEvent
CREATE TABLE "WebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);
