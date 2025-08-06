/*
  Warnings:

  - You are about to drop the column `car_type` on the `cars` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cars" DROP COLUMN "car_type",
ADD COLUMN     "type" "car_type" NOT NULL DEFAULT '준중·중형';
