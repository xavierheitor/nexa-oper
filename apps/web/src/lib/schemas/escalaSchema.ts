/**
 * Schema de validação para Escala (Legacy/Deprecated)
 *
 * NOTA: Este arquivo contém tipos stub para manter compatibilidade
 * com o EscalaService.ts que está desativado.
 * Os tipos reais estão em escalaSchemas.ts
 */

// Tipos stub para evitar erros de compilação
export interface EscalaCreate {
  nome: string;
  descricao?: string | null;
  codigo?: string | null;
  contratoId: number;
  tipoVeiculo?: string | null;
  diasCiclo: number;
  minimoEletricistas: number;
  maximoEletricistas?: number | null;
  inicioCiclo: string | Date;
  ativo?: boolean;
  horarios: Array<{
    indiceCiclo: number;
    diaSemana?: number | null;
    horaInicio?: string | null;
    horaFim?: string | null;
    eletricistasNecessarios: number;
    folga?: boolean;
    etiqueta?: string | null;
    rotacaoOffset?: number;
  }>;
}

export interface EscalaUpdate extends EscalaCreate {
  id: number;
}

export interface EscalaFilter {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  search?: string;
  contratoId?: number;
  ativo?: boolean;
  include?: any;
}

export interface EscalaAssign {
  escalaId: number;
  alocacoes: Array<{
    horarioId: number;
    eletricistaId: number;
    ordemRotacao?: number;
    vigenciaInicio?: string | Date | null;
    vigenciaFim?: string | Date | null;
    ativo?: boolean;
  }>;
}

export interface EscalaAgendaParams {
  id: number;
  dataInicio?: string | Date;
  dataFim?: string | Date;
}

