-- Migração para tornar UUID obrigatório no ChecklistPreenchidos
-- Primeiro, vamos gerar UUIDs para registros existentes que têm NULL

-- Atualizar registros existentes com UUIDs gerados
UPDATE `ChecklistPreenchidos`
SET `uuid` = UUID()
WHERE `uuid` IS NULL;

-- Agora tornar o campo obrigatório
ALTER TABLE `ChecklistPreenchidos`
MODIFY COLUMN `uuid` VARCHAR(36) NOT NULL;

-- Renomear coluna checklistRespostaId para checklistPerguntaId na tabela MobilePhoto
ALTER TABLE `MobilePhoto`
CHANGE COLUMN `checklistRespostaId` `checklistPerguntaId` INTEGER NULL;
