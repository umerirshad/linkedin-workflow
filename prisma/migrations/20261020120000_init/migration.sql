-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ImportSource" AS ENUM ('CSV', 'AUTHORIZED_PROVIDER');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('DRAFT', 'READY', 'RUNNING', 'PAUSED', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "externalKey" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT NOT NULL,
    "headline" TEXT,
    "company" TEXT,
    "profileUrl" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "status" "ProfileStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRun" (
    "id" TEXT NOT NULL,
    "source" "ImportSource" NOT NULL,
    "provider" TEXT,
    "sourceLabel" TEXT,
    "status" "ImportRunStatus" NOT NULL DEFAULT 'RUNNING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "acceptedRows" INTEGER NOT NULL DEFAULT 0,
    "rejectedRows" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListProfile" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "definition" JSONB NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'DRAFT',
    "listId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'READY',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "dueAt" TIMESTAMP(3),
    "profileId" TEXT,
    "executionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_profileUrl_key" ON "Profile"("profileUrl");

-- CreateIndex
CREATE INDEX "Profile_status_idx" ON "Profile"("status");

-- CreateIndex
CREATE INDEX "ImportRun_source_createdAt_idx" ON "ImportRun"("source", "createdAt");

-- CreateIndex
CREATE INDEX "ImportRun_status_createdAt_idx" ON "ImportRun"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ProfileList_name_idx" ON "ProfileList"("name");

-- CreateIndex
CREATE INDEX "ListProfile_listId_createdAt_idx" ON "ListProfile"("listId", "createdAt");

-- CreateIndex
CREATE INDEX "ListProfile_profileId_idx" ON "ListProfile"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "ListProfile_listId_profileId_key" ON "ListProfile"("listId", "profileId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_workflowId_status_idx" ON "WorkflowExecution"("workflowId", "status");

-- CreateIndex
CREATE INDEX "ManualTask_status_dueAt_idx" ON "ManualTask"("status", "dueAt");

-- AddForeignKey
ALTER TABLE "ListProfile" ADD CONSTRAINT "ListProfile_listId_fkey" FOREIGN KEY ("listId") REFERENCES "ProfileList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListProfile" ADD CONSTRAINT "ListProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_listId_fkey" FOREIGN KEY ("listId") REFERENCES "ProfileList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualTask" ADD CONSTRAINT "ManualTask_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualTask" ADD CONSTRAINT "ManualTask_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
