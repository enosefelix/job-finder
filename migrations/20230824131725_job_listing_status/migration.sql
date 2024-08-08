/*
  Warnings:

  - You are about to drop the column `isApproved` on the `job_listing` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- AlterTable
ALTER TABLE "job_listing" DROP COLUMN "isApproved",
ADD COLUMN     "status" "ApprovalStatus" NOT NULL DEFAULT 'Pending';
