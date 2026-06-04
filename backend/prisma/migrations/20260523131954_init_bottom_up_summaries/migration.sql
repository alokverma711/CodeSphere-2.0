-- CreateEnum
CREATE TYPE "public"."SummaryRunStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."SummaryRun" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "status" "public"."SummaryRunStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,

    CONSTRAINT "SummaryRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FileSummary" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT,
    "role" TEXT,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FolderSummary" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,
    "fileCount" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FolderSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RepoSummary" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepoSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SummaryRun_username_repo_branch_startedAt_idx" ON "public"."SummaryRun"("username", "repo", "branch", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "SummaryRun_status_startedAt_idx" ON "public"."SummaryRun"("status", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "FileSummary_path_idx" ON "public"."FileSummary"("path");

-- CreateIndex
CREATE UNIQUE INDEX "FileSummary_runId_path_key" ON "public"."FileSummary"("runId", "path");

-- CreateIndex
CREATE INDEX "FolderSummary_path_idx" ON "public"."FolderSummary"("path");

-- CreateIndex
CREATE UNIQUE INDEX "FolderSummary_runId_path_key" ON "public"."FolderSummary"("runId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "RepoSummary_runId_key" ON "public"."RepoSummary"("runId");

-- AddForeignKey
ALTER TABLE "public"."FileSummary" ADD CONSTRAINT "FileSummary_runId_fkey" FOREIGN KEY ("runId") REFERENCES "public"."SummaryRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FolderSummary" ADD CONSTRAINT "FolderSummary_runId_fkey" FOREIGN KEY ("runId") REFERENCES "public"."SummaryRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RepoSummary" ADD CONSTRAINT "RepoSummary_runId_fkey" FOREIGN KEY ("runId") REFERENCES "public"."SummaryRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
