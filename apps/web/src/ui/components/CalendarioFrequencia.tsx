'use client';

import { Calendar, Badge, Tooltip, Tag } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { ConsolidadoEletricistaResponse } from '@/lib/schemas/turnoRealizadoSchema';

interface CalendarioFrequenciaProps {
  consolidado: ConsolidadoEletricistaResponse;
  dataInicio: Date;
  dataFim: Date;
}

/**
 * Componente de calendário que mostra dias trabalhados, faltas, folgas, etc.
 */
export default function CalendarioFrequencia({
  consolidado,
  dataInicio,
  dataFim,
}: CalendarioFrequenciaProps) {
  // Criar Set de dias com escala para verificar "não escalado"
  const diasComEscalaSet = new Set<string>(consolidado.diasComEscala || []);

  // Função para obter cor de fundo baseada no tipo
  const getBackgroundColor = (
    tipo: string,
    status?: string,
    temEscalaFolga?: boolean
  ): string => {
    switch (tipo) {
      case 'trabalho':
      case 'trabalho_realizado':
        // Verde: trabalhado normal
        return 'rgba(82, 196, 26, 0.2)'; // Verde
      case 'falta':
        // Vermelho: falta
        return 'rgba(255, 77, 79, 0.2)'; // Vermelho
      case 'hora_extra':
        // Azul: trabalhado na folga ou fora da escala
        return 'rgba(24, 144, 255, 0.2)'; // Azul
      case 'folga':
      case 'escala_folga':
        // Folga pode aparecer no calendário (cinza suave)
        return 'rgba(140, 140, 140, 0.1)'; // Cinza muito suave
      case 'escala_trabalho':
        // Se tem escala mas não trabalhou, não colorir (será mostrado como falta se não trabalhou)
        return 'transparent';
      default:
        return 'transparent';
    }
  };

  // ✅ CORREÇÃO: Obter TODOS os eventos de um dia (escala + o que aconteceu)
  const getListData = (value: Dayjs) => {
    const dataStr = value.format('YYYY-MM-DD');

    // Buscar TODOS os eventos deste dia (pode ter múltiplos: escala + trabalho/falta/hora extra)
    const eventosDia = consolidado.detalhamento.filter(
      d => dayjs(d.data).format('YYYY-MM-DD') === dataStr
    );

    if (!eventosDia || eventosDia.length === 0) {
      return [];
    }

    const list: Array<{
      type: string;
      content: string;
      equipe?: string;
      isEscala?: boolean;
    }> = [];

    for (const dia of eventosDia) {
      switch (dia.tipo) {
        case 'escala_trabalho':
          list.push({
            type: 'default',
            content: dia.equipe?.nome
              ? `Escala: ${dia.equipe.nome}`
              : 'Escala: Trabalho',
            equipe: dia.equipe?.nome,
            isEscala: true,
          });
          break;
        case 'escala_folga':
          list.push({
            type: 'default',
            content: 'Escala: Folga',
            isEscala: true,
          });
          break;
        case 'trabalho_realizado':
          list.push({
            type: 'success',
            content: 'Trabalhado',
            equipe: dia.equipe?.nome,
            isEscala: false,
          });
          break;
        case 'falta':
          if (dia.status === 'justificada') {
            list.push({
              type: 'warning',
              content: 'Atestado',
              isEscala: false,
            });
          } else {
            list.push({
              type: 'error',
              content: 'Falta',
              isEscala: false,
            });
          }
          break;
        case 'hora_extra':
          const tipoHoraExtra =
            dia.tipoHoraExtra === 'folga_trabalhada'
              ? 'Hora Extra (Folga)'
              : 'Hora Extra';
          list.push({
            type: 'processing',
            content: tipoHoraExtra,
            equipe: dia.equipe?.nome,
            isEscala: false,
          });
          break;
        case 'folga':
          // Folga sem trabalho (já processada como escala_folga, mas manter compatibilidade)
          if (!list.some(l => l.content === 'Escala: Folga')) {
            list.push({
              type: 'default',
              content: 'Folga',
              isEscala: true,
            });
          }
          break;
      }
    }

    return list;
  };

  // ✅ CORREÇÃO: Customizar célula mostrando TODOS os eventos (escala + o que aconteceu)
  const cellRender = (current: Dayjs) => {
    const dataStr = current.format('YYYY-MM-DD');
    const listData = getListData(current);
    const temEscala = diasComEscalaSet.has(dataStr);

    // Se não há dados para este dia
    if (!listData.length) {
      // Se não tem escala, mostrar "Não escalado"
      if (!temEscala) {
        return (
          <div style={{ fontSize: '10px', color: '#999', fontStyle: 'italic' }}>
            Não escalado
          </div>
        );
      }
      // Se tem escala mas não tem dados, retornar vazio (só o número do dia será mostrado)
      return null;
    }

    // Buscar eventos do dia para obter informações detalhadas
    const eventosDia = consolidado.detalhamento.filter(
      d => dayjs(d.data).format('YYYY-MM-DD') === dataStr
    );

    // Determinar cor de fundo baseado no evento principal (não escala)
    const eventoPrincipal = eventosDia.find(
      e => e.tipo !== 'escala_trabalho' && e.tipo !== 'escala_folga'
    );

    // Verificar se tem escala de folga
    const temEscalaFolga = eventosDia.some(e => e.tipo === 'escala_folga');

    // Se trabalhou na folga (hora extra com escala folga), usar azul
    const trabalhouNaFolga =
      eventoPrincipal?.tipo === 'hora_extra' && temEscalaFolga;

    const backgroundColor = eventoPrincipal
      ? getBackgroundColor(
          eventoPrincipal.tipo,
          eventoPrincipal.status,
          temEscalaFolga
        )
      : temEscalaFolga
        ? getBackgroundColor('escala_folga')
        : 'transparent';

    // Renderizar todos os eventos
    return (
      <div
        style={{
          backgroundColor,
          borderRadius: '4px',
          minHeight: '40px',
          padding: '4px',
          marginTop: '4px',
        }}
      >
        {listData
          .filter(item => {
            // No calendário, mostrar tudo (incluindo folgas)
            // Mas priorizar eventos realizados
            return true;
          })
          .map((item, index) => {
            // Buscar dados do evento correspondente
            const eventoDia = eventosDia.find(e => {
              if (item.isEscala) {
                return (
                  e.tipo === 'escala_trabalho' || e.tipo === 'escala_folga'
                );
              }
              if (item.content === 'Trabalhado')
                return e.tipo === 'trabalho_realizado';
              if (item.content === 'Falta')
                return e.tipo === 'falta' && e.status !== 'justificada';
              if (item.content === 'Atestado')
                return e.tipo === 'falta' && e.status === 'justificada';
              if (item.content.includes('Hora Extra'))
                return e.tipo === 'hora_extra';
              return false;
            });

            // Determinar cor do badge baseado no tipo
            let badgeColor:
              | 'success'
              | 'error'
              | 'processing'
              | 'default'
              | 'warning' = 'default';
            if (item.content === 'Trabalhado' && !item.isEscala) {
              badgeColor = 'success'; // Verde: trabalho normal
            } else if (item.content === 'Falta') {
              badgeColor = 'error'; // Vermelho: falta
            } else if (item.content.includes('Hora Extra')) {
              badgeColor = 'processing'; // Azul: hora extra (trabalho na folga ou fora da escala)
            } else if (item.content === 'Atestado') {
              badgeColor = 'warning'; // Amarelo: atestado
            }

            return (
              <div key={index} style={{ marginTop: index > 0 ? '4px' : 0 }}>
                <Tooltip
                  title={
                    <div>
                      <div>{item.content}</div>
                      {item.equipe && <div>Equipe: {item.equipe}</div>}
                      {eventoDia && eventoDia.horaInicio && (
                        <div>
                          Início: {dayjs(eventoDia.horaInicio).format('HH:mm')}
                        </div>
                      )}
                      {eventoDia && eventoDia.horaFim && (
                        <div>
                          Fim: {dayjs(eventoDia.horaFim).format('HH:mm')}
                        </div>
                      )}
                      {eventoDia && eventoDia.horasRealizadas > 0 && (
                        <div>
                          Horas: {eventoDia.horasRealizadas.toFixed(1)}h
                        </div>
                      )}
                      {eventoDia && eventoDia.horasPrevistas > 0 && (
                        <div>
                          Previstas: {eventoDia.horasPrevistas.toFixed(1)}h
                        </div>
                      )}
                    </div>
                  }
                >
                  <Badge
                    status={badgeColor}
                    text={
                      <span
                        style={{
                          fontSize: item.isEscala ? '10px' : '11px',
                          display: 'block',
                          fontStyle: item.isEscala ? 'italic' : 'normal',
                          opacity: item.isEscala ? 0.8 : 1,
                          fontWeight: !item.isEscala ? 'bold' : 'normal',
                        }}
                      >
                        {item.content}
                      </span>
                    }
                  />
                </Tooltip>
                {eventoDia &&
                  eventoDia.horaInicio &&
                  eventoDia.horaFim &&
                  !item.isEscala && (
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#666',
                        marginTop: '2px',
                      }}
                    >
                      {dayjs(eventoDia.horaInicio).format('HH:mm')} -{' '}
                      {dayjs(eventoDia.horaFim).format('HH:mm')}
                    </div>
                  )}
                {eventoDia &&
                  eventoDia.horaInicio &&
                  !eventoDia.horaFim &&
                  !item.isEscala && (
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#666',
                        marginTop: '2px',
                      }}
                    >
                      Início: {dayjs(eventoDia.horaInicio).format('HH:mm')}
                    </div>
                  )}
                {item.equipe && (
                  <Tag
                    color={
                      badgeColor === 'processing'
                        ? 'blue'
                        : badgeColor === 'success'
                          ? 'green'
                          : 'default'
                    }
                    style={{
                      marginTop: '2px',
                      display: 'block',
                      fontSize: '10px',
                    }}
                  >
                    {item.equipe}
                  </Tag>
                )}
              </div>
            );
          })}
      </div>
    );
  };

  // Desabilitar datas fora do período selecionado
  const disabledDate = (current: Dayjs) => {
    const inicio = dayjs(dataInicio).startOf('day');
    const fim = dayjs(dataFim).endOf('day');
    return current.isBefore(inicio) || current.isAfter(fim);
  };

  // Calcular mês inicial para o calendário (primeiro mês do período)
  const mesInicial = dayjs(dataInicio);

  return (
    <div>
      <Calendar
        mode='month'
        defaultValue={mesInicial}
        cellRender={cellRender}
        disabledDate={disabledDate}
        headerRender={({ value }) => {
          // Customizar header para mostrar apenas o período selecionado
          return (
            <div
              style={{
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              {value.format('MMMM [de] YYYY')}
            </div>
          );
        }}
      />

      {/* Legenda */}
      <div
        style={{
          marginTop: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'center',
        }}
      >
        <Badge status='success' text='Dia Trabalhado' />
        <Badge status='error' text='Falta' />
        <Badge status='warning' text='Atestado' />
        <Badge status='processing' text='Hora Extra' />
        <Badge status='default' text='Folga' />
      </div>
    </div>
  );
}
