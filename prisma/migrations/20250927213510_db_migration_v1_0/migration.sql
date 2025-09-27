/*
  Warnings:

  - You are about to drop the column `publicKeyX` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `publicKeyY` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "publicKeyX",
DROP COLUMN "publicKeyY",
ADD COLUMN     "publicSpenderKey" TEXT,
ADD COLUMN     "publicViewerKey" TEXT;
