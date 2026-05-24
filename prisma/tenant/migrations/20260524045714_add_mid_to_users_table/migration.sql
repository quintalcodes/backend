/*
  Warnings:

  - A unique constraint covering the columns `[m_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "m_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_m_id_key" ON "users"("m_id");
