-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- AlterTable
ALTER TABLE "blog" ADD COLUMN     "status" "BlogStatus" NOT NULL DEFAULT 'Pending';
