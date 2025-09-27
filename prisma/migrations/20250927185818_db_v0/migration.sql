-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('EMPLOYER', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "userType" "public"."UserType" NOT NULL DEFAULT 'EMPLOYEE',
    "hasOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "paymentToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeAddress" TEXT NOT NULL,
    "name" TEXT,
    "salaryPerSecond" BIGINT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "public"."users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_contractAddress_key" ON "public"."organizations"("contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organizationId_employeeAddress_key" ON "public"."employees"("organizationId", "employeeAddress");

-- AddForeignKey
ALTER TABLE "public"."organizations" ADD CONSTRAINT "organizations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
