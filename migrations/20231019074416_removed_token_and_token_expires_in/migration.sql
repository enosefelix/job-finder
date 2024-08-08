/*
  Warnings:

  - You are about to drop the column `token` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `tokenExpiresIn` on the `user` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "user_token_key";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "token",
DROP COLUMN "tokenExpiresIn";
