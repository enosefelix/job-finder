/*
  Warnings:

  - You are about to drop the column `profilePicUrl` on the `profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profile" DROP COLUMN "profilePicUrl",
ADD COLUMN     "profilePic" VARCHAR;

-- CreateTable
CREATE TABLE "blog" (
    "id" UUID NOT NULL,
    "title" VARCHAR NOT NULL,
    "body" VARCHAR NOT NULL,
    "briefDescription" VARCHAR NOT NULL,
    "image" VARCHAR NOT NULL,
    "readTime" VARCHAR NOT NULL,
    "authorId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" UUID,

    CONSTRAINT "blog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "blog" ADD CONSTRAINT "blog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
