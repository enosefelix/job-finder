/*
  Warnings:

  - Changed the type of `startDate` on the `educational_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `endDate` on the `educational_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `startDate` on the `work_experience` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `endDate` on the `work_experience` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "educational_history" DROP COLUMN "startDate",
ADD COLUMN     "startDate" DATE NOT NULL,
DROP COLUMN "endDate",
ADD COLUMN     "endDate" DATE NOT NULL;

-- AlterTable
ALTER TABLE "work_experience" DROP COLUMN "startDate",
ADD COLUMN     "startDate" DATE NOT NULL,
DROP COLUMN "endDate",
ADD COLUMN     "endDate" DATE NOT NULL;
