-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('Email', 'Sms');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('Pending', 'Cancelled', 'Sent', 'Received', 'Failed', 'Deleted');

-- CreateTable
CREATE TABLE "message" (
    "id" UUID NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'Email',
    "bindings" JSONB NOT NULL,
    "templateId" UUID,
    "clientId" UUID NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" UUID,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_file" (
    "id" UUID NOT NULL,
    "filePath" VARCHAR(255) NOT NULL,
    "isAttachment" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "templateId" UUID NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" UUID,

    CONSTRAINT "message_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_template" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'Email',
    "subject" VARCHAR(255),
    "isHtml" BOOLEAN NOT NULL DEFAULT false,
    "body" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" UUID,

    CONSTRAINT "message_template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_file_filePath_key" ON "message_file"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "message_template_code_key" ON "message_template"("code");

-- CreateIndex
CREATE UNIQUE INDEX "message_template_name_type_key" ON "message_template"("name", "type");

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "message_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "message_file" ADD CONSTRAINT "message_file_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "message_template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
