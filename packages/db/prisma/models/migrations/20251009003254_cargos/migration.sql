/*
  Warnings:

  - Added the required column `cargoId` to the `Eletricista` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Eletricista` ADD COLUMN `admissao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `cargoId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Cargo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `salarioBase` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Eletricista` ADD CONSTRAINT `Eletricista_cargoId_fkey` FOREIGN KEY (`cargoId`) REFERENCES `Cargo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
