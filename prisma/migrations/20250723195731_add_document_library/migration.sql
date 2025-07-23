-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('LEASE_AGREEMENT', 'RENT_RECEIPTS', 'INSURANCE_DOCS', 'MOVE_IN_INSPECTION', 'PERSONAL_CORRESPONDENCE', 'REPAIR_PHOTOS', 'DAMAGE_DOCUMENTATION', 'INSPECTION_REPORTS', 'WORK_ORDERS', 'CONTRACTOR_ESTIMATES', 'EMAIL_CORRESPONDENCE', 'WRITTEN_NOTICES', 'TEXT_SCREENSHOTS', 'VOICEMAIL_TRANSCRIPTS', 'LEGAL_NOTICES', 'COURT_DOCUMENTS', 'TENANT_RIGHTS', 'COMPLAINTS_FILED', 'BUILDING_RULES', 'FLOOR_PLANS', 'EMERGENCY_INFO', 'AMENITY_GUIDES', 'UTILITY_BILLS', 'PAYMENT_HISTORY', 'DEPOSIT_RECORDS', 'FEE_NOTICES', 'MEETING_MINUTES', 'MEETING_AGENDAS', 'PETITIONS', 'HOW_TO_GUIDES', 'TEMPLATES', 'CHECKLISTS', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('PUBLIC', 'BUILDING_TENANTS', 'TENANT_ONLY');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "DocumentCategory" NOT NULL,
    "visibility" "DocumentVisibility" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "tags" TEXT[],
    "folderId" TEXT,
    "tenancyId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentFolder" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "visibility" "DocumentVisibility" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueDocument" (
    "issueId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueDocument_pkey" PRIMARY KEY ("issueId","documentId")
);

-- CreateTable
CREATE TABLE "CommunicationDocument" (
    "communicationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationDocument_pkey" PRIMARY KEY ("communicationId","documentId")
);

-- CreateIndex
CREATE INDEX "Document_buildingId_idx" ON "Document"("buildingId");

-- CreateIndex
CREATE INDEX "Document_visibility_idx" ON "Document"("visibility");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- CreateIndex
CREATE INDEX "Document_tenancyId_idx" ON "Document"("tenancyId");

-- CreateIndex
CREATE INDEX "Document_uploadedBy_idx" ON "Document"("uploadedBy");

-- CreateIndex
CREATE INDEX "DocumentFolder_buildingId_idx" ON "DocumentFolder"("buildingId");

-- CreateIndex
CREATE INDEX "DocumentFolder_parentId_idx" ON "DocumentFolder"("parentId");

-- CreateIndex
CREATE INDEX "IssueDocument_issueId_idx" ON "IssueDocument"("issueId");

-- CreateIndex
CREATE INDEX "IssueDocument_documentId_idx" ON "IssueDocument"("documentId");

-- CreateIndex
CREATE INDEX "CommunicationDocument_communicationId_idx" ON "CommunicationDocument"("communicationId");

-- CreateIndex
CREATE INDEX "CommunicationDocument_documentId_idx" ON "CommunicationDocument"("documentId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenancyId_fkey" FOREIGN KEY ("tenancyId") REFERENCES "Tenancy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueDocument" ADD CONSTRAINT "IssueDocument_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueDocument" ADD CONSTRAINT "IssueDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationDocument" ADD CONSTRAINT "CommunicationDocument_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "Communication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationDocument" ADD CONSTRAINT "CommunicationDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
