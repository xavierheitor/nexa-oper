/**
 * Evento emitido após abertura de turno (Turno + TurnoEletricistas + Checklists salvos).
 * Dispara tarefas assíncronas: TurnoRealizado e processamento de pendências/fotos.
 */
export class TurnoAbertoEvent {
  constructor(
    public readonly turnoId: number,
    public readonly equipeId: number,
    public readonly dataReferencia: Date,
    public readonly eletricistas: {
      eletricistaId: number;
      motorista?: boolean;
    }[],
    public readonly dispositivo: string | undefined,
    public readonly versaoApp: string | undefined,
    public readonly checklistPreenchidoIds: number[],
    public readonly respostasAguardandoFoto: number[],
  ) {}
}
