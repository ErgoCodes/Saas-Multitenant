-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Add nullable organizationId first for zero-loss backfill
ALTER TABLE "Board" ADD COLUMN "organizationId" TEXT;

-- Backfill: Create a default workspace for every existing user and attach their boards
INSERT INTO "Organization" ("id", "name", "slug", "createdAt", "updatedAt")
SELECT
    'org-' || "id",
    "name" || '''s Workspace',
    'workspace-' || "id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User";

INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "role", "createdAt")
SELECT
    'member-' || "id",
    'org-' || "id",
    "id",
    'OWNER'::"OrgRole",
    CURRENT_TIMESTAMP
FROM "User";

UPDATE "Board"
SET "organizationId" = 'org-' || "ownerId"
WHERE "organizationId" IS NULL;

-- AlterTable: Enforce NOT NULL and Foreign Key on Board.organizationId
ALTER TABLE "Board" ALTER COLUMN "organizationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
