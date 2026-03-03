ALTER TABLE `AtividadeExecucao`
    ADD COLUMN `atividadeProdutiva` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `causaImprodutiva` VARCHAR(255) NULL;

CREATE INDEX `AtividadeExecucao_atividadeProdutiva_idx`
    ON `AtividadeExecucao`(`atividadeProdutiva`);
