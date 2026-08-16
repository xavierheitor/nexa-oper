CREATE TABLE `InspecaoSegurancaTipo` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `chave` VARCHAR(100) NOT NULL,
  `contexto` ENUM('GERAL', 'COLABORADOR', 'EPC', 'VEICULO') NOT NULL DEFAULT 'GERAL',
  `descricao` VARCHAR(500) NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `contratoId` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(255) NOT NULL,
  `updatedAt` DATETIME(3) NULL,
  `updatedBy` VARCHAR(255) NULL,
  `deletedAt` DATETIME(3) NULL,
  `deletedBy` VARCHAR(255) NULL,
  UNIQUE INDEX `InspecaoSegurancaTipo_chave_key`(`chave`),
  INDEX `InspecaoSegurancaTipo_ativo_contexto_idx`(`ativo`, `contexto`),
  INDEX `InspecaoSegurancaTipo_contratoId_idx`(`contratoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InspecaoSegurancaModelo` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `descricao` VARCHAR(500) NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `tipoId` INTEGER NOT NULL,
  `contratoId` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(255) NOT NULL,
  `updatedAt` DATETIME(3) NULL,
  `updatedBy` VARCHAR(255) NULL,
  `deletedAt` DATETIME(3) NULL,
  `deletedBy` VARCHAR(255) NULL,
  INDEX `InspecaoSegurancaModelo_tipoId_idx`(`tipoId`),
  INDEX `InspecaoSegurancaModelo_contratoId_idx`(`contratoId`),
  INDEX `InspecaoSegurancaModelo_ativo_idx`(`ativo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InspecaoSegurancaGrupoPergunta` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `tipoResposta` ENUM('opcao', 'checkbox', 'texto', 'numero') NOT NULL DEFAULT 'opcao',
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(255) NOT NULL,
  `updatedAt` DATETIME(3) NULL,
  `updatedBy` VARCHAR(255) NULL,
  `deletedAt` DATETIME(3) NULL,
  `deletedBy` VARCHAR(255) NULL,
  INDEX `InspecaoSegurancaGrupoPergunta_ativo_tipoResposta_idx`(`ativo`, `tipoResposta`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InspecaoSegurancaPergunta` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `obrigatoria` BOOLEAN NOT NULL DEFAULT true,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(255) NOT NULL,
  `updatedAt` DATETIME(3) NULL,
  `updatedBy` VARCHAR(255) NULL,
  `deletedAt` DATETIME(3) NULL,
  `deletedBy` VARCHAR(255) NULL,
  INDEX `InspecaoSegurancaPergunta_ativo_idx`(`ativo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InspecaoSegurancaOpcaoResposta` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `geraPendencia` BOOLEAN NOT NULL DEFAULT false,
  `exigeFoto` BOOLEAN NOT NULL DEFAULT false,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(255) NOT NULL,
  `updatedAt` DATETIME(3) NULL,
  `updatedBy` VARCHAR(255) NULL,
  `deletedAt` DATETIME(3) NULL,
  `deletedBy` VARCHAR(255) NULL,
  INDEX `InspecaoSegurancaOpcaoResposta_ativo_geraPendencia_idx`(`ativo`, `geraPendencia`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InspecaoSegurancaModeloGrupoRelacao` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `modeloId` INTEGER NOT NULL,
  `grupoPerguntaId` INTEGER NOT NULL,
  `ordem` INTEGER NOT NULL DEFAULT 0,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(255) NOT NULL,
  `updatedAt` DATETIME(3) NULL,
  `updatedBy` VARCHAR(255) NULL,
  `deletedAt` DATETIME(3) NULL,
  `deletedBy` VARCHAR(255) NULL,
  UNIQUE INDEX `uq_insp_seg_modelo_grupo_ativo`(`modeloId`, `grupoPerguntaId`, `deletedAt`),
  INDEX `InspecaoSegurancaModeloGrupoRelacao_modeloId_ordem_idx`(`modeloId`, `ordem`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InspecaoSegurancaGrupoPerguntaRelacao` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `grupoPerguntaId` INTEGER NOT NULL,
  `perguntaId` INTEGER NOT NULL,
  `ordem` INTEGER NOT NULL DEFAULT 0,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(255) NOT NULL,
  `updatedAt` DATETIME(3) NULL,
  `updatedBy` VARCHAR(255) NULL,
  `deletedAt` DATETIME(3) NULL,
  `deletedBy` VARCHAR(255) NULL,
  UNIQUE INDEX `uq_insp_seg_grupo_pergunta_ativo`(`grupoPerguntaId`, `perguntaId`, `deletedAt`),
  INDEX `InspecaoSegurancaGrupoPerguntaRelacao_grupoPerguntaId_ordem_idx`(`grupoPerguntaId`, `ordem`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InspecaoSegurancaGrupoOpcaoRespostaRelacao` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `grupoPerguntaId` INTEGER NOT NULL,
  `opcaoRespostaId` INTEGER NOT NULL,
  `ordem` INTEGER NOT NULL DEFAULT 0,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(255) NOT NULL,
  `updatedAt` DATETIME(3) NULL,
  `updatedBy` VARCHAR(255) NULL,
  `deletedAt` DATETIME(3) NULL,
  `deletedBy` VARCHAR(255) NULL,
  UNIQUE INDEX `uq_insp_seg_grupo_opcao_ativo`(`grupoPerguntaId`, `opcaoRespostaId`, `deletedAt`),
  INDEX `idx_insp_seg_grp_opc_ord`(`grupoPerguntaId`, `ordem`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InspecaoSegurancaPreenchida` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL,
  `turnoId` INTEGER NOT NULL,
  `modeloId` INTEGER NULL,
  `tipoId` INTEGER NULL,
  `modeloNomeSnapshot` VARCHAR(255) NULL,
  `tipoNomeSnapshot` VARCHAR(255) NULL,
  `tipoChaveSnapshot` VARCHAR(100) NULL,
  `contextoSnapshot` VARCHAR(100) NULL,
  `inspetorMobileUserId` INTEGER NULL,
  `inspetorNomeSnapshot` VARCHAR(255) NULL,
  `colaboradorNomeSnapshot` VARCHAR(255) NULL,
  `epcNomeSnapshot` VARCHAR(255) NULL,
  `veiculoId` INTEGER NULL,
  `placaVeiculoSnapshot` VARCHAR(20) NULL,
  `observacoes` TEXT NULL,
  `realizadaEm` DATETIME(3) NOT NULL,
  `latitude` DOUBLE NULL,
  `longitude` DOUBLE NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(255) NOT NULL,
  `updatedAt` DATETIME(3) NULL,
  `updatedBy` VARCHAR(255) NULL,
  `deletedAt` DATETIME(3) NULL,
  `deletedBy` VARCHAR(255) NULL,
  UNIQUE INDEX `InspecaoSegurancaPreenchida_uuid_key`(`uuid`),
  INDEX `InspecaoSegurancaPreenchida_turnoId_realizadaEm_idx`(`turnoId`, `realizadaEm`),
  INDEX `InspecaoSegurancaPreenchida_modeloId_idx`(`modeloId`),
  INDEX `InspecaoSegurancaPreenchida_tipoId_idx`(`tipoId`),
  INDEX `InspecaoSegurancaPreenchida_veiculoId_idx`(`veiculoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InspecaoSegurancaResposta` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `inspecaoPreenchidaId` INTEGER NOT NULL,
  `grupoPerguntaId` INTEGER NULL,
  `perguntaId` INTEGER NULL,
  `opcaoRespostaId` INTEGER NULL,
  `grupoNomeSnapshot` VARCHAR(255) NULL,
  `perguntaNomeSnapshot` VARCHAR(255) NOT NULL,
  `tipoRespostaSnapshot` VARCHAR(30) NOT NULL,
  `opcaoNomeSnapshot` VARCHAR(255) NULL,
  `respostaTexto` TEXT NULL,
  `marcado` BOOLEAN NULL,
  `ordemGrupo` INTEGER NOT NULL DEFAULT 0,
  `ordemPergunta` INTEGER NOT NULL DEFAULT 0,
  `dataResposta` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `aguardandoFoto` BOOLEAN NOT NULL DEFAULT false,
  `fotosSincronizadas` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(255) NOT NULL,
  `updatedAt` DATETIME(3) NULL,
  `updatedBy` VARCHAR(255) NULL,
  `deletedAt` DATETIME(3) NULL,
  `deletedBy` VARCHAR(255) NULL,
  INDEX `idx_insp_seg_resp_ord`(`inspecaoPreenchidaId`, `ordemGrupo`, `ordemPergunta`),
  INDEX `InspecaoSegurancaResposta_grupoPerguntaId_idx`(`grupoPerguntaId`),
  INDEX `InspecaoSegurancaResposta_perguntaId_idx`(`perguntaId`),
  INDEX `InspecaoSegurancaResposta_opcaoRespostaId_idx`(`opcaoRespostaId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InspecaoSegurancaPendencia` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `respostaId` INTEGER NOT NULL,
  `inspecaoPreenchidaId` INTEGER NOT NULL,
  `turnoId` INTEGER NOT NULL,
  `status` ENUM('AGUARDANDO_TRATAMENTO', 'SANADA_EM_CAMPO', 'EM_TRATAMENTO', 'TRATADA', 'REGISTRO_INCORRETO') NOT NULL DEFAULT 'AGUARDANDO_TRATAMENTO',
  `sanadaEmCampo` BOOLEAN NOT NULL DEFAULT false,
  `observacaoProblema` TEXT NULL,
  `observacaoTratamento` TEXT NULL,
  `tratadoPor` VARCHAR(255) NULL,
  `tratadoEm` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(255) NOT NULL,
  `updatedAt` DATETIME(3) NULL,
  `updatedBy` VARCHAR(255) NULL,
  `deletedAt` DATETIME(3) NULL,
  `deletedBy` VARCHAR(255) NULL,
  UNIQUE INDEX `InspecaoSegurancaPendencia_respostaId_key`(`respostaId`),
  INDEX `InspecaoSegurancaPendencia_turnoId_status_idx`(`turnoId`, `status`),
  INDEX `InspecaoSegurancaPendencia_inspecaoPreenchidaId_idx`(`inspecaoPreenchidaId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InspecaoSegurancaEvidencia` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `respostaId` INTEGER NULL,
  `pendenciaId` INTEGER NULL,
  `tipo` ENUM('PROBLEMA', 'TRATAMENTO') NOT NULL DEFAULT 'PROBLEMA',
  `caminhoArquivo` VARCHAR(500) NOT NULL,
  `urlPublica` VARCHAR(500) NULL,
  `tamanhoBytes` BIGINT NOT NULL,
  `mimeType` VARCHAR(100) NOT NULL,
  `checksum` VARCHAR(64) NULL,
  `sincronizadoEm` DATETIME(3) NOT NULL,
  `metadados` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(255) NOT NULL,
  `updatedAt` DATETIME(3) NULL,
  `updatedBy` VARCHAR(255) NULL,
  `deletedAt` DATETIME(3) NULL,
  `deletedBy` VARCHAR(255) NULL,
  UNIQUE INDEX `uk_insp_seg_evidencia_checksum`(`respostaId`, `tipo`, `checksum`),
  INDEX `InspecaoSegurancaEvidencia_pendenciaId_tipo_idx`(`pendenciaId`, `tipo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `InspecaoSegurancaTipo` ADD CONSTRAINT `InspecaoSegurancaTipo_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaModelo` ADD CONSTRAINT `InspecaoSegurancaModelo_tipoId_fkey` FOREIGN KEY (`tipoId`) REFERENCES `InspecaoSegurancaTipo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaModelo` ADD CONSTRAINT `InspecaoSegurancaModelo_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaModeloGrupoRelacao` ADD CONSTRAINT `InspecaoSegurancaModeloGrupoRelacao_modeloId_fkey` FOREIGN KEY (`modeloId`) REFERENCES `InspecaoSegurancaModelo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaModeloGrupoRelacao` ADD CONSTRAINT `InspecaoSegurancaModeloGrupoRelacao_grupoPerguntaId_fkey` FOREIGN KEY (`grupoPerguntaId`) REFERENCES `InspecaoSegurancaGrupoPergunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaGrupoPerguntaRelacao` ADD CONSTRAINT `InspecaoSegurancaGrupoPerguntaRelacao_grupoPerguntaId_fkey` FOREIGN KEY (`grupoPerguntaId`) REFERENCES `InspecaoSegurancaGrupoPergunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaGrupoPerguntaRelacao` ADD CONSTRAINT `InspecaoSegurancaGrupoPerguntaRelacao_perguntaId_fkey` FOREIGN KEY (`perguntaId`) REFERENCES `InspecaoSegurancaPergunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaGrupoOpcaoRespostaRelacao` ADD CONSTRAINT `InspecaoSegurancaGrupoOpcaoRespostaRelacao_grupoPerguntaId_fkey` FOREIGN KEY (`grupoPerguntaId`) REFERENCES `InspecaoSegurancaGrupoPergunta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaGrupoOpcaoRespostaRelacao` ADD CONSTRAINT `InspecaoSegurancaGrupoOpcaoRespostaRelacao_opcaoRespostaId_fkey` FOREIGN KEY (`opcaoRespostaId`) REFERENCES `InspecaoSegurancaOpcaoResposta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaPreenchida` ADD CONSTRAINT `InspecaoSegurancaPreenchida_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `Turno`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaPreenchida` ADD CONSTRAINT `InspecaoSegurancaPreenchida_modeloId_fkey` FOREIGN KEY (`modeloId`) REFERENCES `InspecaoSegurancaModelo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaPreenchida` ADD CONSTRAINT `InspecaoSegurancaPreenchida_tipoId_fkey` FOREIGN KEY (`tipoId`) REFERENCES `InspecaoSegurancaTipo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaPreenchida` ADD CONSTRAINT `InspecaoSegurancaPreenchida_veiculoId_fkey` FOREIGN KEY (`veiculoId`) REFERENCES `Veiculo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaResposta` ADD CONSTRAINT `InspecaoSegurancaResposta_inspecaoPreenchidaId_fkey` FOREIGN KEY (`inspecaoPreenchidaId`) REFERENCES `InspecaoSegurancaPreenchida`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaResposta` ADD CONSTRAINT `InspecaoSegurancaResposta_grupoPerguntaId_fkey` FOREIGN KEY (`grupoPerguntaId`) REFERENCES `InspecaoSegurancaGrupoPergunta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaResposta` ADD CONSTRAINT `InspecaoSegurancaResposta_perguntaId_fkey` FOREIGN KEY (`perguntaId`) REFERENCES `InspecaoSegurancaPergunta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaResposta` ADD CONSTRAINT `InspecaoSegurancaResposta_opcaoRespostaId_fkey` FOREIGN KEY (`opcaoRespostaId`) REFERENCES `InspecaoSegurancaOpcaoResposta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaPendencia` ADD CONSTRAINT `InspecaoSegurancaPendencia_respostaId_fkey` FOREIGN KEY (`respostaId`) REFERENCES `InspecaoSegurancaResposta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaPendencia` ADD CONSTRAINT `InspecaoSegurancaPendencia_inspecaoPreenchidaId_fkey` FOREIGN KEY (`inspecaoPreenchidaId`) REFERENCES `InspecaoSegurancaPreenchida`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaPendencia` ADD CONSTRAINT `InspecaoSegurancaPendencia_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `Turno`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaEvidencia` ADD CONSTRAINT `InspecaoSegurancaEvidencia_respostaId_fkey` FOREIGN KEY (`respostaId`) REFERENCES `InspecaoSegurancaResposta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `InspecaoSegurancaEvidencia` ADD CONSTRAINT `InspecaoSegurancaEvidencia_pendenciaId_fkey` FOREIGN KEY (`pendenciaId`) REFERENCES `InspecaoSegurancaPendencia`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
