import { Veiculo } from '@nexa-oper/db';
import { VeiculoRepository } from '../repositories/VeiculoRepository';

export class VeiculoService {
  constructor(private readonly veiculoRepository: VeiculoRepository) {}

  async create(veiculo: Veiculo, userId: number): Promise<Veiculo> {
    return await this.veiculoRepository.create(veiculo, userId);
  }

  async update(id: number, veiculo: Veiculo, userId: number): Promise<Veiculo> {
    return await this.veiculoRepository.update(id, veiculo, userId);
  }

  async delete(id: number, userId: number): Promise<Veiculo> {
    return await this.veiculoRepository.delete(id, userId);
  }

  async findAll(): Promise<Veiculo[]> {
    return await this.veiculoRepository.findAll();
  }

  async findById(id: number): Promise<Veiculo | null> {
    return await this.veiculoRepository.findById(id);
  }
}
