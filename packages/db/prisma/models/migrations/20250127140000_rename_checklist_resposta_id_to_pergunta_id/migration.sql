-- Renomear coluna checklistRespostaId para perguntaId na tabela MobilePhoto
ALTER TABLE `MobilePhoto` CHANGE COLUMN `checklistRespostaId` `perguntaId` INTEGER NULL;
