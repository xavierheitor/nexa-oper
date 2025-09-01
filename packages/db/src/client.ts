import { PrismaClient } from '../generated/prisma';

// Configuração do cliente Prisma
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    errorFormat: 'pretty',
  });

  return client;
};

// Cliente Prisma configurado
export const prismaClient = createPrismaClient();

// Função para fechar conexão (útil para testes e shutdown)
export const closePrismaClient = async () => {
  await prismaClient.$disconnect();
};

// Função para conectar (útil para inicialização)
export const connectPrismaClient = async () => {
  await prismaClient.$connect();
};
