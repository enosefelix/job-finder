/*
  Warnings:

  - You are about to drop the column `image` on the `blog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "blog" DROP COLUMN "image";

-- AlterTable
ALTER TABLE "educational_history" ALTER COLUMN "startDate" SET DATA TYPE VARCHAR;

-- AlterTable
ALTER TABLE "work_experience" ALTER COLUMN "startDate" SET DATA TYPE VARCHAR;
