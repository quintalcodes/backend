/*
  Warnings:

  - You are about to drop the column `recurring` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `recurringType` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "recurring",
DROP COLUMN "recurringType",
DROP COLUMN "type";
