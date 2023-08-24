/*
  Warnings:

  - You are about to drop the `_JobListingApplications` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `profile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "_JobListingApplications" DROP CONSTRAINT "_JobListingApplications_A_fkey";

-- DropForeignKey
ALTER TABLE "_JobListingApplications" DROP CONSTRAINT "_JobListingApplications_B_fkey";

-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "email" VARCHAR;

-- DropTable
DROP TABLE "_JobListingApplications";

-- CreateIndex
CREATE UNIQUE INDEX "profile_email_key" ON "profile"("email");
