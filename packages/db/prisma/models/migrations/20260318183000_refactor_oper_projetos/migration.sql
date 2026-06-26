-- Remove tabela legado que saiu do schema
DROP TABLE IF EXISTS `ProjEstrutura`;

-- Garante os catálogos base mesmo em ambientes onde a migration anterior foi marcada
-- como aplicada, mas as tabelas não existem mais no schema físico.
CREATE TABLE IF NOT EXISTS `ProjTipoPoste` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjTipoPoste_nome_idx`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ProjTipoEstrutura` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjTipoEstrutura_nome_idx`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ProjTipoRamal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjTipoRamal_nome_idx`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Completa índices que podem estar ausentes nesses catálogos
SET @sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'ProjTipoPoste'
          AND index_name = 'ProjTipoPoste_deletedAt_idx'
    ),
    'SELECT 1',
    'CREATE INDEX `ProjTipoPoste_deletedAt_idx` ON `ProjTipoPoste`(`deletedAt`)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'ProjTipoEstrutura'
          AND index_name = 'ProjTipoEstrutura_deletedAt_idx'
    ),
    'SELECT 1',
    'CREATE INDEX `ProjTipoEstrutura_deletedAt_idx` ON `ProjTipoEstrutura`(`deletedAt`)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'ProjTipoRamal'
          AND index_name = 'ProjTipoRamal_deletedAt_idx'
    ),
    'SELECT 1',
    'CREATE INDEX `ProjTipoRamal_deletedAt_idx` ON `ProjTipoRamal`(`deletedAt`)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE `ProjMotivoOcorrencia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NOT NULL,
    `tipo` ENUM('CANCELAMENTO_PROGRAMACAO', 'NAO_EXECUCAO_ITEM') NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjMotivoOcorrencia_tipo_idx`(`tipo`),
    INDEX `ProjMotivoOcorrencia_ativo_idx`(`ativo`),
    INDEX `ProjMotivoOcorrencia_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_proj_motivo_ocorrencia_codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjTipoEstruturaMaterial` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contratoId` INTEGER NOT NULL,
    `tipoEstruturaId` INTEGER NOT NULL,
    `materialId` INTEGER NOT NULL,
    `quantidadeBase` DECIMAL(10, 4) NOT NULL,
    `tipoConsumo` ENUM('FIXO', 'VARIAVEL') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjTipoEstruturaMaterial_contratoId_idx`(`contratoId`),
    INDEX `ProjTipoEstruturaMaterial_tipoEstruturaId_idx`(`tipoEstruturaId`),
    INDEX `ProjTipoEstruturaMaterial_materialId_idx`(`materialId`),
    INDEX `ProjTipoEstruturaMaterial_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_proj_tipo_estrutura_material`(`contratoId`, `tipoEstruturaId`, `materialId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjTipoRamalMaterial` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contratoId` INTEGER NOT NULL,
    `tipoRamalId` INTEGER NOT NULL,
    `materialId` INTEGER NOT NULL,
    `quantidadeBase` DECIMAL(10, 4) NOT NULL,
    `tipoConsumo` ENUM('FIXO', 'VARIAVEL') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjTipoRamalMaterial_contratoId_idx`(`contratoId`),
    INDEX `ProjTipoRamalMaterial_tipoRamalId_idx`(`tipoRamalId`),
    INDEX `ProjTipoRamalMaterial_materialId_idx`(`materialId`),
    INDEX `ProjTipoRamalMaterial_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_proj_tipo_ramal_material`(`contratoId`, `tipoRamalId`, `materialId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjetoProgramacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroProjeto` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(255) NOT NULL,
    `contratoId` INTEGER NOT NULL,
    `status` ENUM('PENDENTE', 'EM_PLANEJAMENTO', 'EM_EXECUCAO', 'FINALIZADO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    `equipamento` VARCHAR(255) NULL,
    `concessionaria` VARCHAR(255) NULL,
    `municipio` VARCHAR(255) NULL,
    `observacao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjetoProgramacao_contratoId_idx`(`contratoId`),
    INDEX `ProjetoProgramacao_equipamento_idx`(`equipamento`),
    INDEX `ProjetoProgramacao_municipio_idx`(`municipio`),
    INDEX `ProjetoProgramacao_status_idx`(`status`),
    INDEX `ProjetoProgramacao_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_projeto_programacao_contrato_numero_projeto`(`contratoId`, `numeroProjeto`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjPoste` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `numeroIdentificacao` VARCHAR(100) NOT NULL,
    `tipoPosteId` INTEGER NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `ordem` INTEGER NULL,
    `observacao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjPoste_projetoId_idx`(`projetoId`),
    INDEX `ProjPoste_numeroIdentificacao_idx`(`numeroIdentificacao`),
    INDEX `ProjPoste_tipoPosteId_idx`(`tipoPosteId`),
    INDEX `ProjPoste_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_proj_poste_projeto_numero`(`projetoId`, `numeroIdentificacao`),
    UNIQUE INDEX `uq_proj_poste_id_projeto`(`id`, `projetoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjPosteEstrutura` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `posteId` INTEGER NOT NULL,
    `tipoEstruturaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjPosteEstrutura_posteId_idx`(`posteId`),
    INDEX `ProjPosteEstrutura_tipoEstruturaId_idx`(`tipoEstruturaId`),
    INDEX `ProjPosteEstrutura_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_proj_poste_estrutura`(`posteId`, `tipoEstruturaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjPosteRamal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `posteId` INTEGER NOT NULL,
    `tipoRamalId` INTEGER NOT NULL,
    `quantidadePrevista` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjPosteRamal_posteId_idx`(`posteId`),
    INDEX `ProjPosteRamal_tipoRamalId_idx`(`tipoRamalId`),
    INDEX `ProjPosteRamal_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_proj_poste_ramal`(`posteId`, `tipoRamalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjVao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `posteOrigemId` INTEGER NOT NULL,
    `posteDestinoId` INTEGER NOT NULL,
    `distanciaMetros` DECIMAL(10, 2) NULL,
    `caboPrevistoMetros` DECIMAL(10, 2) NULL,
    `valorServicoMetro` DECIMAL(12, 2) NULL,
    `observacao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjVao_projetoId_idx`(`projetoId`),
    INDEX `ProjVao_posteOrigemId_idx`(`posteOrigemId`),
    INDEX `ProjVao_posteDestinoId_idx`(`posteDestinoId`),
    INDEX `ProjVao_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_proj_vao_id_projeto`(`id`, `projetoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjProgramacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `status` ENUM('PENDENTE', 'PLANEJADA', 'AVISOS_ENTREGUES', 'DESLIGAMENTO_CONFIRMADO', 'LIBERADA', 'EM_EXECUCAO', 'PARCIAL', 'CONCLUIDA', 'CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    `siNumero` VARCHAR(100) NULL,
    `dataProgramada` DATETIME(3) NULL,
    `percentualPrevisto` DECIMAL(5, 2) NULL,
    `reprogramadaDeId` INTEGER NULL,
    `viabilizado` BOOLEAN NOT NULL DEFAULT false,
    `avisosEntregues` BOOLEAN NOT NULL DEFAULT false,
    `desligamentoNecessario` BOOLEAN NOT NULL DEFAULT false,
    `desligamentoConfirmado` BOOLEAN NOT NULL DEFAULT false,
    `protocoloConcessionaria` VARCHAR(255) NULL,
    `observacao` TEXT NULL,
    `motivoCancelamentoId` INTEGER NULL,
    `motivoCancelamentoObs` TEXT NULL,
    `canceladaEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjProgramacao_projetoId_idx`(`projetoId`),
    INDEX `ProjProgramacao_siNumero_idx`(`siNumero`),
    INDEX `ProjProgramacao_status_idx`(`status`),
    INDEX `ProjProgramacao_dataProgramada_idx`(`dataProgramada`),
    INDEX `ProjProgramacao_reprogramadaDeId_idx`(`reprogramadaDeId`),
    INDEX `ProjProgramacao_motivoCancelamentoId_idx`(`motivoCancelamentoId`),
    INDEX `ProjProgramacao_canceladaEm_idx`(`canceladaEm`),
    INDEX `ProjProgramacao_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_proj_programacao_id_projeto`(`id`, `projetoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjProgramacaoPoste` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `programacaoId` INTEGER NOT NULL,
    `posteId` INTEGER NOT NULL,
    `ordemPlanejamento` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjProgramacaoPoste_projetoId_idx`(`projetoId`),
    INDEX `ProjProgramacaoPoste_programacaoId_idx`(`programacaoId`),
    INDEX `ProjProgramacaoPoste_posteId_idx`(`posteId`),
    INDEX `ProjProgramacaoPoste_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_proj_programacao_poste`(`programacaoId`, `posteId`),
    UNIQUE INDEX `uq_proj_programacao_poste_id_projeto`(`id`, `projetoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjProgramacaoVao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `programacaoId` INTEGER NOT NULL,
    `vaoId` INTEGER NOT NULL,
    `ordemPlanejamento` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjProgramacaoVao_projetoId_idx`(`projetoId`),
    INDEX `ProjProgramacaoVao_programacaoId_idx`(`programacaoId`),
    INDEX `ProjProgramacaoVao_vaoId_idx`(`vaoId`),
    INDEX `ProjProgramacaoVao_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_proj_programacao_vao`(`programacaoId`, `vaoId`),
    UNIQUE INDEX `uq_proj_programacao_vao_id_projeto`(`id`, `projetoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjProgramacaoRamal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `programacaoId` INTEGER NOT NULL,
    `posteId` INTEGER NOT NULL,
    `tipoRamalId` INTEGER NOT NULL,
    `quantidadePlanejada` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjProgramacaoRamal_projetoId_idx`(`projetoId`),
    INDEX `ProjProgramacaoRamal_programacaoId_idx`(`programacaoId`),
    INDEX `ProjProgramacaoRamal_posteId_idx`(`posteId`),
    INDEX `ProjProgramacaoRamal_tipoRamalId_idx`(`tipoRamalId`),
    INDEX `ProjProgramacaoRamal_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_proj_programacao_ramal`(`programacaoId`, `posteId`, `tipoRamalId`),
    UNIQUE INDEX `uq_proj_programacao_ramal_id_projeto`(`id`, `projetoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjExecucao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `programacaoId` INTEGER NULL,
    `turnoId` INTEGER NULL,
    `dataExecucao` DATETIME(3) NULL,
    `enviadaEm` DATETIME(3) NULL,
    `statusGeral` ENUM('EXECUTADO', 'PARCIAL', 'TERCEIROS', 'IMPEDIDO', 'NAO_EXECUTADO') NULL,
    `observacao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjExecucao_projetoId_idx`(`projetoId`),
    INDEX `ProjExecucao_programacaoId_idx`(`programacaoId`),
    INDEX `ProjExecucao_turnoId_idx`(`turnoId`),
    INDEX `ProjExecucao_dataExecucao_idx`(`dataExecucao`),
    INDEX `ProjExecucao_enviadaEm_idx`(`enviadaEm`),
    INDEX `ProjExecucao_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_proj_execucao_id_projeto`(`id`, `projetoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjExecucaoPoste` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `execucaoId` INTEGER NOT NULL,
    `posteId` INTEGER NOT NULL,
    `programacaoPosteId` INTEGER NULL,
    `resultado` ENUM('EXECUTADO', 'TERCEIROS', 'IMPEDIDO', 'NAO_EXECUTADO') NOT NULL,
    `motivoOcorrenciaId` INTEGER NULL,
    `motivoOcorrenciaObs` TEXT NULL,
    `observacao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjExecucaoPoste_projetoId_idx`(`projetoId`),
    INDEX `ProjExecucaoPoste_execucaoId_idx`(`execucaoId`),
    INDEX `ProjExecucaoPoste_posteId_idx`(`posteId`),
    INDEX `ProjExecucaoPoste_programacaoPosteId_idx`(`programacaoPosteId`),
    INDEX `ProjExecucaoPoste_motivoOcorrenciaId_idx`(`motivoOcorrenciaId`),
    INDEX `ProjExecucaoPoste_resultado_idx`(`resultado`),
    INDEX `ProjExecucaoPoste_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_proj_execucao_poste_id_projeto`(`id`, `projetoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjExecucaoVao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `execucaoId` INTEGER NOT NULL,
    `vaoId` INTEGER NOT NULL,
    `programacaoVaoId` INTEGER NULL,
    `motivoOcorrenciaId` INTEGER NULL,
    `motivoOcorrenciaObs` TEXT NULL,
    `resultado` ENUM('EXECUTADO', 'TERCEIROS', 'IMPEDIDO', 'NAO_EXECUTADO') NOT NULL,
    `caboExecutadoMetros` DECIMAL(10, 2) NULL,
    `observacao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjExecucaoVao_projetoId_idx`(`projetoId`),
    INDEX `ProjExecucaoVao_execucaoId_idx`(`execucaoId`),
    INDEX `ProjExecucaoVao_vaoId_idx`(`vaoId`),
    INDEX `ProjExecucaoVao_programacaoVaoId_idx`(`programacaoVaoId`),
    INDEX `ProjExecucaoVao_motivoOcorrenciaId_idx`(`motivoOcorrenciaId`),
    INDEX `ProjExecucaoVao_resultado_idx`(`resultado`),
    INDEX `ProjExecucaoVao_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_proj_execucao_vao_id_projeto`(`id`, `projetoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjExecucaoRamal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `execucaoId` INTEGER NOT NULL,
    `posteId` INTEGER NOT NULL,
    `tipoRamalId` INTEGER NOT NULL,
    `programacaoRamalId` INTEGER NULL,
    `motivoOcorrenciaId` INTEGER NULL,
    `motivoOcorrenciaObs` TEXT NULL,
    `resultado` ENUM('EXECUTADO', 'PARCIAL', 'TERCEIROS', 'IMPEDIDO', 'NAO_EXECUTADO') NOT NULL,
    `quantidadeExecutada` INTEGER NOT NULL DEFAULT 0,
    `caboExecutadoMetros` DECIMAL(10, 2) NULL,
    `observacao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjExecucaoRamal_projetoId_idx`(`projetoId`),
    INDEX `ProjExecucaoRamal_execucaoId_idx`(`execucaoId`),
    INDEX `ProjExecucaoRamal_posteId_idx`(`posteId`),
    INDEX `ProjExecucaoRamal_tipoRamalId_idx`(`tipoRamalId`),
    INDEX `ProjExecucaoRamal_programacaoRamalId_idx`(`programacaoRamalId`),
    INDEX `ProjExecucaoRamal_motivoOcorrenciaId_idx`(`motivoOcorrenciaId`),
    INDEX `ProjExecucaoRamal_resultado_idx`(`resultado`),
    INDEX `ProjExecucaoRamal_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `uq_proj_execucao_ramal_id_projeto`(`id`, `projetoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjEvidencia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `alvoTipo` ENUM('EXECUCAO', 'EXECUCAO_POSTE', 'EXECUCAO_VAO', 'EXECUCAO_RAMAL') NOT NULL,
    `execucaoId` INTEGER NULL,
    `execucaoPosteId` INTEGER NULL,
    `execucaoVaoId` INTEGER NULL,
    `execucaoRamalId` INTEGER NULL,
    `tipo` ENUM('FOTO', 'VIDEO', 'DOCUMENTO') NOT NULL,
    `arquivo` VARCHAR(500) NOT NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `observacao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(255) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(255) NULL,

    INDEX `ProjEvidencia_projetoId_idx`(`projetoId`),
    INDEX `ProjEvidencia_execucaoId_idx`(`execucaoId`),
    INDEX `ProjEvidencia_execucaoPosteId_idx`(`execucaoPosteId`),
    INDEX `ProjEvidencia_execucaoVaoId_idx`(`execucaoVaoId`),
    INDEX `ProjEvidencia_execucaoRamalId_idx`(`execucaoRamalId`),
    INDEX `ProjEvidencia_alvoTipo_idx`(`alvoTipo`),
    INDEX `ProjEvidencia_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjHistoricoProjeto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `statusAnterior` ENUM('PENDENTE', 'EM_PLANEJAMENTO', 'EM_EXECUCAO', 'FINALIZADO', 'CANCELADO') NULL,
    `statusNovo` ENUM('PENDENTE', 'EM_PLANEJAMENTO', 'EM_EXECUCAO', 'FINALIZADO', 'CANCELADO') NOT NULL,
    `observacao` TEXT NULL,
    `motivoOcorrenciaId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,

    INDEX `ProjHistoricoProjeto_projetoId_idx`(`projetoId`),
    INDEX `ProjHistoricoProjeto_statusNovo_idx`(`statusNovo`),
    INDEX `ProjHistoricoProjeto_motivoOcorrenciaId_idx`(`motivoOcorrenciaId`),
    INDEX `ProjHistoricoProjeto_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjHistoricoProgramacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoId` INTEGER NOT NULL,
    `programacaoId` INTEGER NOT NULL,
    `statusAnterior` ENUM('PENDENTE', 'PLANEJADA', 'AVISOS_ENTREGUES', 'DESLIGAMENTO_CONFIRMADO', 'LIBERADA', 'EM_EXECUCAO', 'PARCIAL', 'CONCLUIDA', 'CANCELADA') NULL,
    `statusNovo` ENUM('PENDENTE', 'PLANEJADA', 'AVISOS_ENTREGUES', 'DESLIGAMENTO_CONFIRMADO', 'LIBERADA', 'EM_EXECUCAO', 'PARCIAL', 'CONCLUIDA', 'CANCELADA') NOT NULL,
    `observacao` TEXT NULL,
    `motivoOcorrenciaId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(255) NOT NULL,

    INDEX `ProjHistoricoProgramacao_projetoId_idx`(`projetoId`),
    INDEX `ProjHistoricoProgramacao_programacaoId_idx`(`programacaoId`),
    INDEX `ProjHistoricoProgramacao_statusNovo_idx`(`statusNovo`),
    INDEX `ProjHistoricoProgramacao_motivoOcorrenciaId_idx`(`motivoOcorrenciaId`),
    INDEX `ProjHistoricoProgramacao_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ProjTipoEstruturaMaterial` ADD CONSTRAINT `ProjTipoEstruturaMaterial_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjTipoEstruturaMaterial` ADD CONSTRAINT `ProjTipoEstruturaMaterial_tipoEstruturaId_fkey` FOREIGN KEY (`tipoEstruturaId`) REFERENCES `ProjTipoEstrutura`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjTipoEstruturaMaterial` ADD CONSTRAINT `ProjTipoEstruturaMaterial_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `MaterialCatalogo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjTipoRamalMaterial` ADD CONSTRAINT `ProjTipoRamalMaterial_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjTipoRamalMaterial` ADD CONSTRAINT `ProjTipoRamalMaterial_tipoRamalId_fkey` FOREIGN KEY (`tipoRamalId`) REFERENCES `ProjTipoRamal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjTipoRamalMaterial` ADD CONSTRAINT `ProjTipoRamalMaterial_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `MaterialCatalogo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjetoProgramacao` ADD CONSTRAINT `ProjetoProgramacao_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjPoste` ADD CONSTRAINT `ProjPoste_projetoId_fkey` FOREIGN KEY (`projetoId`) REFERENCES `ProjetoProgramacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjPoste` ADD CONSTRAINT `ProjPoste_tipoPosteId_fkey` FOREIGN KEY (`tipoPosteId`) REFERENCES `ProjTipoPoste`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjPosteEstrutura` ADD CONSTRAINT `ProjPosteEstrutura_posteId_fkey` FOREIGN KEY (`posteId`) REFERENCES `ProjPoste`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjPosteEstrutura` ADD CONSTRAINT `ProjPosteEstrutura_tipoEstruturaId_fkey` FOREIGN KEY (`tipoEstruturaId`) REFERENCES `ProjTipoEstrutura`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjPosteRamal` ADD CONSTRAINT `ProjPosteRamal_posteId_fkey` FOREIGN KEY (`posteId`) REFERENCES `ProjPoste`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjPosteRamal` ADD CONSTRAINT `ProjPosteRamal_tipoRamalId_fkey` FOREIGN KEY (`tipoRamalId`) REFERENCES `ProjTipoRamal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjVao` ADD CONSTRAINT `ProjVao_projetoId_fkey` FOREIGN KEY (`projetoId`) REFERENCES `ProjetoProgramacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjVao` ADD CONSTRAINT `ProjVao_posteOrigemId_projetoId_fkey` FOREIGN KEY (`posteOrigemId`, `projetoId`) REFERENCES `ProjPoste`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjVao` ADD CONSTRAINT `ProjVao_posteDestinoId_projetoId_fkey` FOREIGN KEY (`posteDestinoId`, `projetoId`) REFERENCES `ProjPoste`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjProgramacao` ADD CONSTRAINT `ProjProgramacao_projetoId_fkey` FOREIGN KEY (`projetoId`) REFERENCES `ProjetoProgramacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjProgramacao` ADD CONSTRAINT `ProjProgramacao_motivoCancelamentoId_fkey` FOREIGN KEY (`motivoCancelamentoId`) REFERENCES `ProjMotivoOcorrencia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjProgramacao` ADD CONSTRAINT `ProjProgramacao_reprogramadaDeId_projetoId_fkey` FOREIGN KEY (`reprogramadaDeId`, `projetoId`) REFERENCES `ProjProgramacao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjProgramacaoPoste` ADD CONSTRAINT `ProjProgramacaoPoste_programacaoId_projetoId_fkey` FOREIGN KEY (`programacaoId`, `projetoId`) REFERENCES `ProjProgramacao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjProgramacaoPoste` ADD CONSTRAINT `ProjProgramacaoPoste_posteId_projetoId_fkey` FOREIGN KEY (`posteId`, `projetoId`) REFERENCES `ProjPoste`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjProgramacaoVao` ADD CONSTRAINT `ProjProgramacaoVao_programacaoId_projetoId_fkey` FOREIGN KEY (`programacaoId`, `projetoId`) REFERENCES `ProjProgramacao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjProgramacaoVao` ADD CONSTRAINT `ProjProgramacaoVao_vaoId_projetoId_fkey` FOREIGN KEY (`vaoId`, `projetoId`) REFERENCES `ProjVao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjProgramacaoRamal` ADD CONSTRAINT `ProjProgramacaoRamal_programacaoId_projetoId_fkey` FOREIGN KEY (`programacaoId`, `projetoId`) REFERENCES `ProjProgramacao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjProgramacaoRamal` ADD CONSTRAINT `ProjProgramacaoRamal_posteId_projetoId_fkey` FOREIGN KEY (`posteId`, `projetoId`) REFERENCES `ProjPoste`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjProgramacaoRamal` ADD CONSTRAINT `ProjProgramacaoRamal_tipoRamalId_fkey` FOREIGN KEY (`tipoRamalId`) REFERENCES `ProjTipoRamal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjProgramacaoRamal` ADD CONSTRAINT `ProjProgramacaoRamal_posteId_tipoRamalId_fkey` FOREIGN KEY (`posteId`, `tipoRamalId`) REFERENCES `ProjPosteRamal`(`posteId`, `tipoRamalId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucao` ADD CONSTRAINT `ProjExecucao_projetoId_fkey` FOREIGN KEY (`projetoId`) REFERENCES `ProjetoProgramacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucao` ADD CONSTRAINT `ProjExecucao_programacaoId_projetoId_fkey` FOREIGN KEY (`programacaoId`, `projetoId`) REFERENCES `ProjProgramacao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucao` ADD CONSTRAINT `ProjExecucao_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `Turno`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucaoPoste` ADD CONSTRAINT `ProjExecucaoPoste_programacaoPosteId_projetoId_fkey` FOREIGN KEY (`programacaoPosteId`, `projetoId`) REFERENCES `ProjProgramacaoPoste`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucaoPoste` ADD CONSTRAINT `ProjExecucaoPoste_motivoOcorrenciaId_fkey` FOREIGN KEY (`motivoOcorrenciaId`) REFERENCES `ProjMotivoOcorrencia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucaoPoste` ADD CONSTRAINT `ProjExecucaoPoste_execucaoId_projetoId_fkey` FOREIGN KEY (`execucaoId`, `projetoId`) REFERENCES `ProjExecucao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucaoPoste` ADD CONSTRAINT `ProjExecucaoPoste_posteId_projetoId_fkey` FOREIGN KEY (`posteId`, `projetoId`) REFERENCES `ProjPoste`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucaoVao` ADD CONSTRAINT `ProjExecucaoVao_programacaoVaoId_projetoId_fkey` FOREIGN KEY (`programacaoVaoId`, `projetoId`) REFERENCES `ProjProgramacaoVao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucaoVao` ADD CONSTRAINT `ProjExecucaoVao_motivoOcorrenciaId_fkey` FOREIGN KEY (`motivoOcorrenciaId`) REFERENCES `ProjMotivoOcorrencia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucaoVao` ADD CONSTRAINT `ProjExecucaoVao_execucaoId_projetoId_fkey` FOREIGN KEY (`execucaoId`, `projetoId`) REFERENCES `ProjExecucao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucaoVao` ADD CONSTRAINT `ProjExecucaoVao_vaoId_projetoId_fkey` FOREIGN KEY (`vaoId`, `projetoId`) REFERENCES `ProjVao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucaoRamal` ADD CONSTRAINT `ProjExecucaoRamal_programacaoRamalId_projetoId_fkey` FOREIGN KEY (`programacaoRamalId`, `projetoId`) REFERENCES `ProjProgramacaoRamal`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucaoRamal` ADD CONSTRAINT `ProjExecucaoRamal_motivoOcorrenciaId_fkey` FOREIGN KEY (`motivoOcorrenciaId`) REFERENCES `ProjMotivoOcorrencia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucaoRamal` ADD CONSTRAINT `ProjExecucaoRamal_execucaoId_projetoId_fkey` FOREIGN KEY (`execucaoId`, `projetoId`) REFERENCES `ProjExecucao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucaoRamal` ADD CONSTRAINT `ProjExecucaoRamal_posteId_projetoId_fkey` FOREIGN KEY (`posteId`, `projetoId`) REFERENCES `ProjPoste`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucaoRamal` ADD CONSTRAINT `ProjExecucaoRamal_tipoRamalId_fkey` FOREIGN KEY (`tipoRamalId`) REFERENCES `ProjTipoRamal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjExecucaoRamal` ADD CONSTRAINT `ProjExecucaoRamal_posteId_tipoRamalId_fkey` FOREIGN KEY (`posteId`, `tipoRamalId`) REFERENCES `ProjPosteRamal`(`posteId`, `tipoRamalId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjEvidencia` ADD CONSTRAINT `ProjEvidencia_projetoId_fkey` FOREIGN KEY (`projetoId`) REFERENCES `ProjetoProgramacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjEvidencia` ADD CONSTRAINT `ProjEvidencia_execucaoId_projetoId_fkey` FOREIGN KEY (`execucaoId`, `projetoId`) REFERENCES `ProjExecucao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjEvidencia` ADD CONSTRAINT `ProjEvidencia_execucaoPosteId_projetoId_fkey` FOREIGN KEY (`execucaoPosteId`, `projetoId`) REFERENCES `ProjExecucaoPoste`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjEvidencia` ADD CONSTRAINT `ProjEvidencia_execucaoVaoId_projetoId_fkey` FOREIGN KEY (`execucaoVaoId`, `projetoId`) REFERENCES `ProjExecucaoVao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjEvidencia` ADD CONSTRAINT `ProjEvidencia_execucaoRamalId_projetoId_fkey` FOREIGN KEY (`execucaoRamalId`, `projetoId`) REFERENCES `ProjExecucaoRamal`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjHistoricoProjeto` ADD CONSTRAINT `ProjHistoricoProjeto_projetoId_fkey` FOREIGN KEY (`projetoId`) REFERENCES `ProjetoProgramacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjHistoricoProjeto` ADD CONSTRAINT `ProjHistoricoProjeto_motivoOcorrenciaId_fkey` FOREIGN KEY (`motivoOcorrenciaId`) REFERENCES `ProjMotivoOcorrencia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjHistoricoProgramacao` ADD CONSTRAINT `ProjHistoricoProgramacao_projetoId_fkey` FOREIGN KEY (`projetoId`) REFERENCES `ProjetoProgramacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjHistoricoProgramacao` ADD CONSTRAINT `ProjHistoricoProgramacao_programacaoId_projetoId_fkey` FOREIGN KEY (`programacaoId`, `projetoId`) REFERENCES `ProjProgramacao`(`id`, `projetoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjHistoricoProgramacao` ADD CONSTRAINT `ProjHistoricoProgramacao_motivoOcorrenciaId_fkey` FOREIGN KEY (`motivoOcorrenciaId`) REFERENCES `ProjMotivoOcorrencia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
