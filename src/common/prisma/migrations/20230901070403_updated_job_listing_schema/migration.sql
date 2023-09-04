/*
  Warnings:

  - You are about to drop the column `career` on the `job_listing` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `job_listing` table. All the data in the column will be lost.
  - You are about to drop the column `jobPosition` on the `job_listing` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `job_listing` table. All the data in the column will be lost.
  - Added the required column `companyDetails` to the `job_listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyName` to the `job_listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `experienceLevel` to the `job_listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobDescription` to the `job_listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobRequirements` to the `job_listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobType` to the `job_listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `job_listing` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('Junior', 'MidLevel', 'Senior', 'EntryLevel', 'Internship', 'Associate', 'Principal');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FullTime', 'PartTime', 'Contract', 'Freelance', 'Internship', 'Temporary');

-- AlterTable
ALTER TABLE "job_listing" DROP COLUMN "career",
DROP COLUMN "description",
DROP COLUMN "jobPosition",
DROP COLUMN "summary",
ADD COLUMN     "companyDetails" VARCHAR NOT NULL,
ADD COLUMN     "companyName" VARCHAR NOT NULL,
ADD COLUMN     "experienceLevel" "ExperienceLevel" NOT NULL,
ADD COLUMN     "jobDescription" VARCHAR NOT NULL,
ADD COLUMN     "jobRequirements" VARCHAR NOT NULL,
ADD COLUMN     "jobType" "JobType" NOT NULL,
ADD COLUMN     "role" VARCHAR NOT NULL;
