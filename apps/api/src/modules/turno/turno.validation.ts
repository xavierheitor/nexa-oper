import { Prisma } from '@nexa-oper/db';
import { PrismaService } from '../../database/prisma.service';
import { AbrirTurnoDto } from './dto/abrir-turno.dto';
import { FecharTurnoDto } from './dto/fechar-turno.dto';
import { AppError } from '../../core/errors/app-error';

async function lockTurnoResourcesForOpen(
  dto: AbrirTurnoDto,
  prisma: PrismaService,
): Promise<void> {
  const veiculoRows = await prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
    SELECT id
    FROM Veiculo
    WHERE id = ${dto.veiculoId}
    FOR UPDATE
  `);
  if (veiculoRows.length === 0) {
    throw AppError.validation('Veículo não encontrado');
  }

  const equipeRows = await prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
    SELECT id
    FROM Equipe
    WHERE id = ${dto.equipeId}
    FOR UPDATE
  `);
  if (equipeRows.length === 0) {
    throw AppError.validation('Equipe não encontrada');
  }

  const eletricistaIds = Array.from(
    new Set(dto.eletricistas.map((e) => e.eletricistaId)),
  );
  if (eletricistaIds.length === 0) return;

  const eletricistaRows = await prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
    SELECT id
    FROM Eletricista
    WHERE id IN (${Prisma.join(eletricistaIds)})
    FOR UPDATE
  `);

  if (eletricistaRows.length !== eletricistaIds.length) {
    throw AppError.validation('Eletricista não encontrado');
  }
}

export async function validateAbrirTurno(
  dto: AbrirTurnoDto,
  prisma: PrismaService,
): Promise<void> {
  if (!dto.eletricistas || dto.eletricistas.length === 0) {
    throw AppError.validation('Pelo menos um eletricista é obrigatório');
  }
  const temMotorista = dto.eletricistas.some((e) => e.motorista);
  if (!temMotorista) {
    throw AppError.validation('Informe um eletricista como motorista');
  }

  await lockTurnoResourcesForOpen(dto, prisma);

  const inicio = dto.dataInicio ?? new Date();
  const inicioDia = new Date(inicio);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(inicio);
  fimDia.setHours(23, 59, 59, 999);
  const eletricistaIds = dto.eletricistas.map((e) => e.eletricistaId);
  const conflito = await prisma.turno.findFirst({
    where: {
      dataFim: null,
      dataInicio: { gte: inicioDia, lte: fimDia },
      OR: [
        { veiculoId: dto.veiculoId },
        { equipeId: dto.equipeId },
        ...(eletricistaIds.length > 0
          ? [
              {
                TurnoEletricistas: {
                  some: { eletricistaId: { in: eletricistaIds } },
                },
              },
            ]
          : []),
      ],
    },
  });
  if (conflito) {
    throw AppError.conflict(
      'Já existe um turno aberto para o veículo, equipe ou eletricista neste dia',
    );
  }
}

export async function validateFecharTurno(
  dto: FecharTurnoDto,
  prisma: PrismaService,
): Promise<void> {
  const turnoId = dto.turnoId;
  if (!turnoId) {
    throw AppError.validation('turnoId é obrigatório');
  }
  const turno = await prisma.turno.findUnique({ where: { id: turnoId } });
  if (!turno) {
    throw AppError.notFound('Turno não encontrado');
  }
  if (turno.dataFim != null) {
    throw AppError.conflict('O turno já está fechado');
  }
  const kmFim = dto.kmFim ?? dto.kmFinal;
  if (kmFim != null && kmFim < turno.kmInicio) {
    throw AppError.validation(
      'Quilometragem final deve ser maior que a inicial',
    );
  }
  const dataFim = dto.dataFim ?? dto.horaFim ?? new Date();
  if (dataFim < turno.dataInicio) {
    throw AppError.validation('Data fim não pode ser anterior à data início');
  }
}
