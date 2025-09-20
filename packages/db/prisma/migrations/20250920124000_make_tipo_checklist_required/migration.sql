-- Tornar o campo tipoChecklistId obrigatório (NOT NULL)
ALTER TABLE `ChecklistTipoEquipeRelacao` MODIFY COLUMN `tipoChecklistId` INTEGER NOT NULL;

-- Remover a unique key antiga
ALTER TABLE `ChecklistTipoEquipeRelacao` DROP INDEX `unique_active_checklist_tipo_equipe`;

-- Adicionar a nova unique key que permite múltiplos checklists por tipo de equipe
-- mas não permite checklists do mesmo tipo ativos simultaneamente
ALTER TABLE `ChecklistTipoEquipeRelacao` ADD CONSTRAINT `unique_active_checklist_tipo_por_equipe` UNIQUE (`tipoEquipeId`, `tipoChecklistId`, `deletedAt`);
