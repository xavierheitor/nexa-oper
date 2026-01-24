import { Prisma } from '@nexa-oper/db';

export type SlotComEletricista = Prisma.SlotEscalaGetPayload<{
  include: {
    eletricista: { include: { Status: true } };
    escalaEquipePeriodo: true;
  };
}>;

export type AberturaTurno = Prisma.TurnoRealizadoEletricistaGetPayload<{
  include: {
    turnoRealizado: { select: { equipeId: true } };
    eletricista: { include: { Status: true } };
  };
}>;

export type AberturasPorEletricistaMap = Map<
  number,
  {
    equipes: Set<number>;
    itens: AberturaTurno[];
  }
>;
