/*
  Warnings:

  - Added the required column `createdBy` to the `TipoChecklist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `TipoChecklist` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `createdBy` VARCHAR(255) NOT NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `deletedBy` VARCHAR(255) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NULL,
    ADD COLUMN `updatedBy` VARCHAR(255) NULL;
