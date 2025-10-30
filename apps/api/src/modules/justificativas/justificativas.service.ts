import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface CriarTipoDTO { nome: string; descricao?: string; ativo?: boolean; createdBy: string }
export interface AtualizarTipoDTO { nome?: string; descricao?: string; ativo?: boolean; updatedBy: string }

export interface CriarJustificativaDTO {
  faltaId: number;
  tipoId: number;
  descricao?: string;
  createdBy: string;
}

@Injectable()
export class JustificativasService {
  constructor(private readonly db: DatabaseService) {}

  // Tipos de justificativa
  async listarTipos() {
    return this.db.getPrisma().tipoJustificativa.findMany({ orderBy: { nome: 'asc' } });
  }
  async criarTipo(data: CriarTipoDTO) {
    return this.db.getPrisma().tipoJustificativa.create({ data: {
      nome: data.nome,
      descricao: data.descricao ?? null,
      ativo: data.ativo ?? true,
      createdBy: data.createdBy,
    }});
  }
  async atualizarTipo(id: number, data: AtualizarTipoDTO) {
    return this.db.getPrisma().tipoJustificativa.update({ where: { id }, data: {
      nome: data.nome,
      descricao: data.descricao,
      ativo: data.ativo,
    }});
  }

  // Justificativas
  async criarJustificativa(dto: CriarJustificativaDTO) {
    const prisma = this.db.getPrisma();
    return await prisma.$transaction(async (tx) => {
      const just = await tx.justificativa.create({ data: {
        tipoId: dto.tipoId,
        descricao: dto.descricao ?? null,
        status: 'pendente',
        createdBy: dto.createdBy,
      }});
      await tx.faltaJustificativa.create({ data: {
        faltaId: dto.faltaId,
        justificativaId: just.id,
      }});
      return just;
    });
  }

  async aprovarJustificativa(id: number, decidedBy: string) {
    const prisma = this.db.getPrisma();
    const just = await prisma.justificativa.update({ where: { id }, data: {
      status: 'aprovada', decidedBy, decidedAt: new Date(),
    }});
    // Atualiza faltas vinculadas
    await prisma.falta.updateMany({
      where: { Justificativas: { some: { justificativaId: id } } },
      data: { status: 'justificada' },
    });
    return just;
  }

  async rejeitarJustificativa(id: number, decidedBy: string) {
    const prisma = this.db.getPrisma();
    const just = await prisma.justificativa.update({ where: { id }, data: {
      status: 'rejeitada', decidedBy, decidedAt: new Date(),
    }});
    await prisma.falta.updateMany({
      where: { Justificativas: { some: { justificativaId: id } } },
      data: { status: 'indeferida' },
    });
    return just;
  }
}


