/*
  Warnings:

  - You are about to drop the column `degree` on the `educational_history` table. All the data in the column will be lost.
  - You are about to drop the column `jobDescription` on the `job_listing` table. All the data in the column will be lost.
  - You are about to drop the column `employmentStatus` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `industry` on the `profile` table. All the data in the column will be lost.
  - Added the required column `location` to the `educational_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `work_experience` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobType` to the `work_experience` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization` to the `work_experience` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `work_experience` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "educational_history" DROP COLUMN "degree",
ADD COLUMN     "location" VARCHAR NOT NULL;

-- AlterTable
ALTER TABLE "job_listing" DROP COLUMN "jobDescription",
ADD COLUMN     "jobResponsibilities" VARCHAR[];

-- AlterTable
ALTER TABLE "profile" DROP COLUMN "employmentStatus",
DROP COLUMN "industry";

-- AlterTable
ALTER TABLE "work_experience" ADD COLUMN     "country" VARCHAR NOT NULL,
ADD COLUMN     "jobDescription" VARCHAR[],
ADD COLUMN     "jobType" "JobType" NOT NULL,
ADD COLUMN     "organization" VARCHAR NOT NULL,
ADD COLUMN     "state" VARCHAR NOT NULL;

-- CreateTable
CREATE TABLE "certifications" (
    "id" UUID NOT NULL,
    "name" VARCHAR,
    "organization" VARCHAR NOT NULL,
    "yearIssued" VARCHAR NOT NULL,
    "expiryYear" VARCHAR NOT NULL,
    "profileId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" UUID,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume" (
    "id" UUID NOT NULL,
    "resume" VARCHAR NOT NULL,
    "coverLetter" VARCHAR NOT NULL,
    "profileId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" UUID,

    CONSTRAINT "resume_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume" ADD CONSTRAINT "resume_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
