-- Adicionar campo UUID opcional ao ChecklistPreenchidos
ALTER TABLE `ChecklistPreenchidos` ADD COLUMN `uuid` VARCHAR(36) NULL;

-- Criar índice único para melhorar performance nas buscas por UUID
CREATE UNIQUE INDEX `ChecklistPreenchidos_uuid_key` ON `ChecklistPreenchidos`(`uuid`);
