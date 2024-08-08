-- CreateTable
CREATE TABLE "Comment" (
    "id" UUID NOT NULL,
    "comment" VARCHAR NOT NULL,
    "userId" UUID NOT NULL,
    "jobListingId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_jobListingId_fkey" FOREIGN KEY ("jobListingId") REFERENCES "job_listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
