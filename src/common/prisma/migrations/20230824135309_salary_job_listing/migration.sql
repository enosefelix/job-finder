/*
  Warnings:

  - Added the required column `salary` to the `job_listing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "job_listing" ADD COLUMN     "salary" VARCHAR NOT NULL;
