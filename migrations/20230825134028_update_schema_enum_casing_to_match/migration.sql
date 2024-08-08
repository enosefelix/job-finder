/*
  Warnings:

  - The values [BASIC,CONVERSATIONAL,PROFICIENT,FLUENT,NATIVE] on the enum `LanguageProficiency` will be removed. If these variants are still used in the database, this will fail.
  - The values [BEGINNER,INTERMEDIATE,ADVANCED,EXPERT] on the enum `SkillLevel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LanguageProficiency_new" AS ENUM ('Basic', 'Conversational', 'Proficient', 'Fluent', 'Native');
ALTER TABLE "languages" ALTER COLUMN "proficiency" TYPE "LanguageProficiency_new" USING ("proficiency"::text::"LanguageProficiency_new");
ALTER TYPE "LanguageProficiency" RENAME TO "LanguageProficiency_old";
ALTER TYPE "LanguageProficiency_new" RENAME TO "LanguageProficiency";
DROP TYPE "LanguageProficiency_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SkillLevel_new" AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');
ALTER TABLE "skill" ALTER COLUMN "skillLevel" TYPE "SkillLevel_new" USING ("skillLevel"::text::"SkillLevel_new");
ALTER TYPE "SkillLevel" RENAME TO "SkillLevel_old";
ALTER TYPE "SkillLevel_new" RENAME TO "SkillLevel";
DROP TYPE "SkillLevel_old";
COMMIT;
