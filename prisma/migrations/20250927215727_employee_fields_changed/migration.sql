/*
  Warnings:

  - You are about to drop the column `employeeAddress` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `publicSpenderKeyX` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `publicSpenderKeyY` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `publicViewerKeyX` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `publicViewerKeyY` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `hasOnboarded` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."employees_organisationId_employeeAddress_key";

-- AlterTable
ALTER TABLE "public"."employees" DROP COLUMN "employeeAddress",
DROP COLUMN "name",
DROP COLUMN "publicSpenderKeyX",
DROP COLUMN "publicSpenderKeyY",
DROP COLUMN "publicViewerKeyX",
DROP COLUMN "publicViewerKeyY",
ALTER COLUMN "employeeId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "hasOnboarded";

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
