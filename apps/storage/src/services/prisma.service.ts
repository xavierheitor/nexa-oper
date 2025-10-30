import { PrismaClient } from '@prisma/client';

export class PrismaService {
  private static instance: PrismaClient;

  get client() {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient();
    }
    return PrismaService.instance;
  }

  async disconnect() {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
    }
  }
}

