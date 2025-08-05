/*
  Warnings:

  - Added the required column `file_url` to the `uploads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "uploads" ADD COLUMN     "file_url" VARCHAR(500) NOT NULL;
