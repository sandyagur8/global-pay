-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "preferedChainId" INTEGER,
ADD COLUMN     "preferedToken" TEXT,
ADD COLUMN     "publicKeyX" TEXT,
ADD COLUMN     "publicKeyY" TEXT;
