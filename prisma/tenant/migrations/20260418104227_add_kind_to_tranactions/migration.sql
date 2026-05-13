/*
  Warnings:

  - Added the required column `kind` to the `RecurringTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kind` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GoalTransaction" ADD COLUMN     "kind" TEXT;

-- AlterTable
ALTER TABLE "RecurringTransaction" ADD COLUMN     "kind" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "kind" TEXT NOT NULL;
