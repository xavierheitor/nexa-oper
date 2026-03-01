-- DropForeignKey
ALTER TABLE `AtividadeAprPreenchida` DROP FOREIGN KEY `AtividadeAprPreenchida_aprId_fkey`;

-- DropForeignKey
ALTER TABLE `AtividadeAprPreenchida` DROP FOREIGN KEY `AtividadeAprPreenchida_tipoAtividadeId_fkey`;

-- DropForeignKey
ALTER TABLE `AtividadeAprPreenchida` DROP FOREIGN KEY `AtividadeAprPreenchida_tipoAtividadeServicoId_fkey`;

-- DropForeignKey
ALTER TABLE `AtividadeAprResposta` DROP FOREIGN KEY `AtividadeAprResposta_aprGrupoPerguntaId_fkey`;

-- DropForeignKey
ALTER TABLE `AtividadeAprResposta` DROP FOREIGN KEY `AtividadeAprResposta_aprOpcaoRespostaId_fkey`;

-- DropForeignKey
ALTER TABLE `AtividadeAprResposta` DROP FOREIGN KEY `AtividadeAprResposta_aprPerguntaId_fkey`;

-- AddForeignKey
ALTER TABLE `AtividadeAprPreenchida` ADD CONSTRAINT `AtividadeAprPreenchida_aprId_fkey` FOREIGN KEY (`aprId`) REFERENCES `Apr`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeAprPreenchida` ADD CONSTRAINT `AtividadeAprPreenchida_tipoAtividadeId_fkey` FOREIGN KEY (`tipoAtividadeId`) REFERENCES `TipoAtividade`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeAprPreenchida` ADD CONSTRAINT `AtividadeAprPreenchida_tipoAtividadeServicoId_fkey` FOREIGN KEY (`tipoAtividadeServicoId`) REFERENCES `TipoAtividadeServico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeAprResposta` ADD CONSTRAINT `AtividadeAprResposta_aprGrupoPerguntaId_fkey` FOREIGN KEY (`aprGrupoPerguntaId`) REFERENCES `AprGrupoPergunta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeAprResposta` ADD CONSTRAINT `AtividadeAprResposta_aprPerguntaId_fkey` FOREIGN KEY (`aprPerguntaId`) REFERENCES `AprPergunta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtividadeAprResposta` ADD CONSTRAINT `AtividadeAprResposta_aprOpcaoRespostaId_fkey` FOREIGN KEY (`aprOpcaoRespostaId`) REFERENCES `AprOpcaoResposta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
