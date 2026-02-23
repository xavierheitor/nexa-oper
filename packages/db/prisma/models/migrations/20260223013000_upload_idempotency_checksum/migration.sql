-- Upload evidence deduplication support
ALTER TABLE `UploadEvidences`
  ADD COLUMN `checksum` VARCHAR(64) NULL,
  ADD COLUMN `idempotencyKey` VARCHAR(255) NULL;

CREATE UNIQUE INDEX `uk_upload_evidence_idempotency`
  ON `UploadEvidences`(`idempotencyKey`);

CREATE INDEX `idx_upload_evidence_checksum`
  ON `UploadEvidences`(`checksum`);

-- Checklist photo deduplication per resposta
ALTER TABLE `ChecklistRespostaFotos`
  ADD COLUMN `checksum` VARCHAR(64) NULL;

CREATE UNIQUE INDEX `uk_checklist_resposta_foto_checksum`
  ON `ChecklistRespostaFotos`(`checklistRespostaId`, `checksum`);
