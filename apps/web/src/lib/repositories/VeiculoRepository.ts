import { Veiculo } from '@nexa-oper/db';
import { prisma } from '../db/db.service';

export class VeiculoRepository {
  async create(veiculo: Veiculo, userId: number): Promise<Veiculo> {
    return await prisma.veiculo.create({
      data: { ...veiculo, createdBy: userId.toString() },
    });
  }

  async findAll(): Promise<Veiculo[]> {
    return await prisma.veiculo.findMany();
  }

  async findById(id: number): Promise<Veiculo | null> {
    return await prisma.veiculo.findUnique({ where: { id } });
  }

  async update(id: number, veiculo: Veiculo, userId: number): Promise<Veiculo> {
    return await prisma.veiculo.update({
      where: { id },
      data: { ...veiculo, updatedBy: userId.toString() },
    });
  }

  async delete(id: number, userId: number): Promise<Veiculo> {
    return await prisma.veiculo.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId.toString() },
    });
  }
}
