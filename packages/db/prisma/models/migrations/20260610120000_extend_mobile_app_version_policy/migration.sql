-- Extend mobile app release metadata for API-driven auto-update policies.
ALTER TABLE `MobileAppVersion`
  ADD COLUMN `build` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `arquivoPath` VARCHAR(1024) NULL,
  ADD COLUMN `apkSizeBytes` INTEGER NULL,
  ADD COLUMN `sha256` VARCHAR(128) NULL,
  ADD COLUMN `wipeRequired` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `minSupportedBuild` INTEGER NULL,
  ADD COLUMN `minLoginBuild` INTEGER NULL,
  ADD COLUMN `minOpenTurnoBuild` INTEGER NULL,
  ADD COLUMN `minUploadBuild` INTEGER NULL;

CREATE INDEX `MobileAppVersion_plataforma_ativo_idx`
  ON `MobileAppVersion`(`plataforma`, `ativo`);

CREATE INDEX `MobileAppVersion_plataforma_build_idx`
  ON `MobileAppVersion`(`plataforma`, `build`);
