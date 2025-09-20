-- Adicionar coluna tipoChecklistId como opcional temporariamente
ALTER TABLE `ChecklistTipoEquipeRelacao` ADD COLUMN `tipoChecklistId` INTEGER NULL;

-- Adicionar foreign key constraint
ALTER TABLE `ChecklistTipoEquipeRelacao` ADD CONSTRAINT `ChecklistTipoEquipeRelacao_tipoChecklistId_fkey` FOREIGN KEY (`tipoChecklistId`) REFERENCES `TipoChecklist`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Atualizar registros existentes com o tipoChecklistId baseado no checklist vinculado
UPDATE `ChecklistTipoEquipeRelacao`
SET `tipoChecklistId` = (
    SELECT `tipoChecklistId`
    FROM `Checklist`
    WHERE `Checklist`.`id` = `ChecklistTipoEquipeRelacao`.`checklistId`
)
WHERE `tipoChecklistId` IS NULL;
