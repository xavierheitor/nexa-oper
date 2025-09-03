-- CreateTable
CREATE TABLE `MobileUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `MobileUser_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessoes_mobile` (
    `id` VARCHAR(191) NOT NULL,
    `deviceInfo` TEXT NULL,
    `lastActive` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `ativa` BOOLEAN NOT NULL DEFAULT true,
    `mobileUserId` INTEGER NOT NULL,

    INDEX `sessoes_mobile_mobileUserId_idx`(`mobileUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tokens_mobile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(255) NOT NULL,
    `refreshToken` VARCHAR(255) NULL,
    `refreshTokenExpiresAt` DATETIME(3) NULL,
    `usuarioMobileId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `revoked` BOOLEAN NOT NULL DEFAULT false,
    `mobileUserId` INTEGER NOT NULL,

    UNIQUE INDEX `tokens_mobile_token_key`(`token`),
    UNIQUE INDEX `tokens_mobile_refreshToken_key`(`refreshToken`),
    INDEX `tokens_mobile_mobileUserId_idx`(`mobileUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `username` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_username_key`(`username`),
    INDEX `User_username_idx`(`username`),
    INDEX `User_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contas` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,

    INDEX `contas_userId_idx`(`userId`),
    UNIQUE INDEX `contas_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessoes` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `sessoes_sessionToken_key`(`sessionToken`),
    INDEX `sessoes_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tokens_verificacao` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tokens_verificacao_token_key`(`token`),
    UNIQUE INDEX `tokens_verificacao_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoleUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoChecklist` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Checklist` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `tipoChecklistId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistPergunta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistPerguntaRelacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `checklistPerguntaId` INTEGER NOT NULL,
    `checklistId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistOpcaoResposta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `geraPendencia` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistOpcaoRespostaRelacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `checklistOpcaoRespostaId` INTEGER NOT NULL,
    `checklistId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contrato` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `numero` VARCHAR(255) NOT NULL,
    `dataInicio` DATETIME(3) NULL,
    `dataFim` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Eletricista` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `matricula` VARCHAR(255) NOT NULL,
    `telefone` VARCHAR(255) NOT NULL,
    `estado` VARCHAR(2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,
    `contratoId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoEquipe` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Equipe` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `tipoEquipeId` INTEGER NOT NULL,
    `contratoId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EquipeSupervisor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `equipeId` INTEGER NOT NULL,
    `supervisorId` INTEGER NOT NULL,
    `inicio` DATETIME(3) NOT NULL,
    `fim` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Supervisor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `contratoId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Turno` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataSolicitacao` DATETIME(3) NOT NULL,
    `dataInicio` DATETIME(3) NOT NULL,
    `dataFim` DATETIME(3) NULL,
    `veiculoId` INTEGER NOT NULL,
    `equipeId` INTEGER NOT NULL,
    `dispositivo` VARCHAR(255) NOT NULL,
    `kmInicio` INTEGER NOT NULL,
    `KmFim` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TurnoEletricistas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `turnoId` INTEGER NOT NULL,
    `eletricistaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoVeiculo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Veiculo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `placa` VARCHAR(8) NOT NULL,
    `modelo` VARCHAR(255) NOT NULL,
    `ano` INTEGER NOT NULL,
    `tipoVeiculoId` INTEGER NOT NULL,
    `contratoId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VeiculoOdometro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `valor` INTEGER NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `veiculoId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessoes_mobile` ADD CONSTRAINT `sessoes_mobile_mobileUserId_fkey` FOREIGN KEY (`mobileUserId`) REFERENCES `MobileUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tokens_mobile` ADD CONSTRAINT `tokens_mobile_mobileUserId_fkey` FOREIGN KEY (`mobileUserId`) REFERENCES `MobileUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contas` ADD CONSTRAINT `contas_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessoes` ADD CONSTRAINT `sessoes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoleUser` ADD CONSTRAINT `RoleUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoleUser` ADD CONSTRAINT `RoleUser_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Checklist` ADD CONSTRAINT `Checklist_tipoChecklistId_fkey` FOREIGN KEY (`tipoChecklistId`) REFERENCES `TipoChecklist`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistPerguntaRelacao` ADD CONSTRAINT `ChecklistPerguntaRelacao_checklistPerguntaId_fkey` FOREIGN KEY (`checklistPerguntaId`) REFERENCES `ChecklistPergunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistPerguntaRelacao` ADD CONSTRAINT `ChecklistPerguntaRelacao_checklistId_fkey` FOREIGN KEY (`checklistId`) REFERENCES `Checklist`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistOpcaoRespostaRelacao` ADD CONSTRAINT `ChecklistOpcaoRespostaRelacao_checklistOpcaoRespostaId_fkey` FOREIGN KEY (`checklistOpcaoRespostaId`) REFERENCES `ChecklistOpcaoResposta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistOpcaoRespostaRelacao` ADD CONSTRAINT `ChecklistOpcaoRespostaRelacao_checklistId_fkey` FOREIGN KEY (`checklistId`) REFERENCES `Checklist`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Eletricista` ADD CONSTRAINT `Eletricista_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Equipe` ADD CONSTRAINT `Equipe_tipoEquipeId_fkey` FOREIGN KEY (`tipoEquipeId`) REFERENCES `TipoEquipe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Equipe` ADD CONSTRAINT `Equipe_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EquipeSupervisor` ADD CONSTRAINT `EquipeSupervisor_equipeId_fkey` FOREIGN KEY (`equipeId`) REFERENCES `Equipe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EquipeSupervisor` ADD CONSTRAINT `EquipeSupervisor_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `Supervisor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Supervisor` ADD CONSTRAINT `Supervisor_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Turno` ADD CONSTRAINT `Turno_veiculoId_fkey` FOREIGN KEY (`veiculoId`) REFERENCES `Veiculo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Turno` ADD CONSTRAINT `Turno_equipeId_fkey` FOREIGN KEY (`equipeId`) REFERENCES `Equipe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TurnoEletricistas` ADD CONSTRAINT `TurnoEletricistas_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `Turno`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TurnoEletricistas` ADD CONSTRAINT `TurnoEletricistas_eletricistaId_fkey` FOREIGN KEY (`eletricistaId`) REFERENCES `Eletricista`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Veiculo` ADD CONSTRAINT `Veiculo_tipoVeiculoId_fkey` FOREIGN KEY (`tipoVeiculoId`) REFERENCES `TipoVeiculo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Veiculo` ADD CONSTRAINT `Veiculo_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VeiculoOdometro` ADD CONSTRAINT `VeiculoOdometro_veiculoId_fkey` FOREIGN KEY (`veiculoId`) REFERENCES `Veiculo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
