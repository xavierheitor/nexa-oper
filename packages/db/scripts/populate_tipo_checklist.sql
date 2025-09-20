-- Script para popular o campo tipoChecklistId na tabela ChecklistTipoEquipeRelacao
-- baseado no tipoChecklistId do checklist vinculado

UPDATE `ChecklistTipoEquipeRelacao`
SET `tipoChecklistId` = (
    SELECT `tipoChecklistId`
    FROM `Checklist`
    WHERE `Checklist`.`id` = `ChecklistTipoEquipeRelacao`.`checklistId`
)
WHERE `tipoChecklistId` IS NULL;

-- Verificar se todos os registros foram populados
SELECT
    cter.id,
    cter.checklistId,
    cter.tipoEquipeId,
    cter.tipoChecklistId,
    c.nome as checklist_nome,
    tc.nome as tipo_checklist_nome
FROM `ChecklistTipoEquipeRelacao` cter
LEFT JOIN `Checklist` c ON c.id = cter.checklistId
LEFT JOIN `TipoChecklist` tc ON tc.id = cter.tipoChecklistId
WHERE cter.deletedAt IS NULL;
