-- AlterTable
ALTER TABLE "public"."SummaryRun" ADD COLUMN     "commitHash" TEXT;

-- CreateIndex
CREATE INDEX "SummaryRun_username_repo_branch_commitHash_idx" ON "public"."SummaryRun"("username", "repo", "branch", "commitHash");
