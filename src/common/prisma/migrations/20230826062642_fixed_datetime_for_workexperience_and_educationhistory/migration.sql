/*
  Warnings:

  - You are about to drop the column `name` on the `educational_history` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "educational_history" DROP COLUMN "name",
ALTER COLUMN "startDate" SET DATA TYPE VARCHAR,
ALTER COLUMN "endDate" SET DATA TYPE VARCHAR,
ALTER COLUMN "fieldOfStudy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "work_experience" ALTER COLUMN "startDate" SET DATA TYPE VARCHAR,
ALTER COLUMN "endDate" SET DATA TYPE VARCHAR;
