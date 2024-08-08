/*
  Warnings:

  - A unique constraint covering the columns `[approvedById]` on the table `blog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "blog" ADD COLUMN     "approvedById" UUID,
ADD COLUMN     "postedById" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "blog_approvedById_key" ON "blog"("approvedById");

-- AddForeignKey
ALTER TABLE "blog" ADD CONSTRAINT "blog_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
