/*
  Warnings:

  - You are about to drop the column `organizationId` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `salaryPerSecond` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the `organizations` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[organisationId,employeeAddress]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organisationId,employeeId]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `employeeId` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organisationId` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicSpenderKeyX` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicSpenderKeyY` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicViewerKeyX` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicViewerKeyY` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."employees" DROP CONSTRAINT "employees_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."organizations" DROP CONSTRAINT "organizations_ownerId_fkey";

-- DropIndex
DROP INDEX "public"."employees_organizationId_employeeAddress_key";

-- AlterTable
ALTER TABLE "public"."employees" DROP COLUMN "organizationId",
DROP COLUMN "salaryPerSecond",
DROP COLUMN "startDate",
ADD COLUMN     "employeeId" BIGINT NOT NULL,
ADD COLUMN     "organisationId" TEXT NOT NULL,
ADD COLUMN     "publicSpenderKeyX" TEXT NOT NULL,
ADD COLUMN     "publicSpenderKeyY" TEXT NOT NULL,
ADD COLUMN     "publicViewerKeyX" TEXT NOT NULL,
ADD COLUMN     "publicViewerKeyY" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."organizations";

-- CreateTable
CREATE TABLE "public"."organisations" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "orgID" BIGINT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organisations_orgID_key" ON "public"."organisations"("orgID");

-- CreateIndex
CREATE UNIQUE INDEX "organisations_contractAddress_key" ON "public"."organisations"("contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organisationId_employeeAddress_key" ON "public"."employees"("organisationId", "employeeAddress");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organisationId_employeeId_key" ON "public"."employees"("organisationId", "employeeId");

-- AddForeignKey
ALTER TABLE "public"."organisations" ADD CONSTRAINT "organisations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "public"."organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
