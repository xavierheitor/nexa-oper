-- Move contract ownership from ProjTipoEstruturaMaterial to ProjTipoEstrutura.
-- Backfill the new contract column from existing material associations before
-- making it required.

ALTER TABLE `ProjTipoEstrutura`
    ADD COLUMN `contratoId` INTEGER NULL;

UPDATE `ProjTipoEstrutura` pte
SET `contratoId` = (
    SELECT pem.`contratoId`
    FROM `ProjTipoEstruturaMaterial` pem
    WHERE pem.`tipoEstruturaId` = pte.`id`
    ORDER BY (pem.`deletedAt` IS NOT NULL), pem.`id`
    LIMIT 1
)
WHERE pte.`contratoId` IS NULL;

UPDATE `ProjTipoEstrutura`
SET `contratoId` = (
    SELECT c.`id`
    FROM `Contrato` c
    WHERE c.`deletedAt` IS NULL
    ORDER BY c.`id`
    LIMIT 1
)
WHERE `contratoId` IS NULL;

UPDATE `ProjTipoEstrutura`
SET `contratoId` = (
    SELECT c.`id`
    FROM `Contrato` c
    ORDER BY c.`id`
    LIMIT 1
)
WHERE `contratoId` IS NULL;

ALTER TABLE `ProjTipoEstrutura`
    MODIFY `contratoId` INTEGER NOT NULL;

ALTER TABLE `ProjTipoEstrutura`
    ADD CONSTRAINT `ProjTipoEstrutura_contratoId_fkey`
        FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX `ProjTipoEstrutura_contratoId_idx` ON `ProjTipoEstrutura`(`contratoId`);
CREATE UNIQUE INDEX `uq_proj_tipo_estrutura_contrato_nome`
    ON `ProjTipoEstrutura`(`contratoId`, `nome`);

ALTER TABLE `ProjTipoEstruturaMaterial`
    DROP FOREIGN KEY `ProjTipoEstruturaMaterial_contratoId_fkey`;

DROP INDEX `uq_proj_tipo_estrutura_material` ON `ProjTipoEstruturaMaterial`;
DROP INDEX `ProjTipoEstruturaMaterial_contratoId_idx` ON `ProjTipoEstruturaMaterial`;

ALTER TABLE `ProjTipoEstruturaMaterial`
    DROP COLUMN `contratoId`;

CREATE UNIQUE INDEX `uq_proj_tipo_estrutura_material`
    ON `ProjTipoEstruturaMaterial`(`tipoEstruturaId`, `materialId`);
