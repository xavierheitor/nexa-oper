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
  // Criar mapa de dados por data (YYYY-MM-DD)
  const dadosPorData = new Map<string, typeof consolidado.detalhamento[0]>();

  consolidado.detalhamento.forEach((dia) => {
    const dataStr = dayjs(dia.data).format('YYYY-MM-DD');
    dadosPorData.set(dataStr, dia);
  });

  // Criar Set de dias com escala para verificar "não escalado"
  const diasComEscalaSet = new Set<string>(consolidado.diasComEscala || []);

  // Função para obter cor de fundo baseada no tipo
  const getBackgroundColor = (tipo: string, status?: string): string => {
    switch (tipo) {
      case 'trabalho':
        return 'rgba(82, 196, 26, 0.15)'; // Verde suave
      case 'falta':
        if (status === 'justificada') {
          return 'rgba(250, 173, 20, 0.15)'; // Amarelo suave (atestado)
        }
        return 'rgba(255, 77, 79, 0.15)'; // Vermelho suave
      case 'hora_extra':
        return 'rgba(24, 144, 255, 0.15)'; // Azul suave
      case 'folga':
        return 'rgba(140, 140, 140, 0.1)'; // Cinza muito suave
      default:
        return 'transparent';
    }
  };

  // Função para obter a lista de eventos de um dia
  const getListData = (value: Dayjs) => {
    const dataStr = value.format('YYYY-MM-DD');
    const dia = dadosPorData.get(dataStr);

    if (!dia) {
      return [];
    }

    const list: Array<{ type: string; content: string; equipe?: string }> = [];

    switch (dia.tipo) {
      case 'trabalho':
        list.push({
          type: 'success',
          content: 'Trabalhado',
          equipe: dia.equipe?.nome,
        });
        break;
      case 'falta':
        if (dia.status === 'justificada') {
          list.push({
            type: 'warning',
            content: 'Atestado',
          });
        } else {
          list.push({
            type: 'error',
            content: 'Falta',
          });
        }
        break;
      case 'hora_extra':
        list.push({
          type: 'processing',
          content: 'Hora Extra',
          equipe: dia.equipe?.nome,
        });
        break;
      case 'folga':
        list.push({
          type: 'default',
          content: 'Folga',
        });
        break;
    }

    return list;
  };

  // Customizar apenas o conteúdo da célula (não o número do dia, que já é renderizado pelo calendário)
  const cellRender = (current: Dayjs, info: any) => {
    const dataStr = current.format('YYYY-MM-DD');
    const dia = dadosPorData.get(dataStr);
    const listData = getListData(current);
    const temEscala = diasComEscalaSet.has(dataStr);

    // Se não há dados para este dia
    if (!dia || !listData.length) {
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

    const backgroundColor = getBackgroundColor(dia.tipo, dia.status);

    // Renderizar apenas o conteúdo customizado (sem o número do dia)
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
        {listData.map((item, index) => (
          <div key={index} style={{ marginTop: index > 0 ? '4px' : 0 }}>
            <Tooltip
              title={
                <div>
                  <div>{item.content}</div>
                  {item.equipe && <div>Equipe: {item.equipe}</div>}
                  {dia && dia.horaInicio && (
                    <div>Início: {dayjs(dia.horaInicio).format('HH:mm')}</div>
                  )}
                  {dia && dia.horaFim && (
                    <div>Fim: {dayjs(dia.horaFim).format('HH:mm')}</div>
                  )}
                  {dia && dia.horasRealizadas > 0 && (
                    <div>Horas: {dia.horasRealizadas.toFixed(1)}h</div>
                  )}
                </div>
              }
            >
              <Badge
                status={item.type as any}
                text={
                  <span style={{ fontSize: '11px', display: 'block' }}>
                    {item.content}
                  </span>
                }
              />
            </Tooltip>
            {dia && dia.horaInicio && dia.horaFim && (
              <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                {dayjs(dia.horaInicio).format('HH:mm')} - {dayjs(dia.horaFim).format('HH:mm')}
              </div>
            )}
            {dia && dia.horaInicio && !dia.horaFim && (
              <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                Início: {dayjs(dia.horaInicio).format('HH:mm')}
              </div>
            )}
            {item.equipe && (
              <Tag size="small" color="blue" style={{ marginTop: '2px', display: 'block', fontSize: '10px' }}>
                {item.equipe}
              </Tag>
            )}
          </div>
        ))}
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
        mode="month"
        defaultValue={mesInicial}
        cellRender={cellRender}
        disabledDate={disabledDate}
        headerRender={({ value, type, onChange, onTypeChange }) => {
          // Customizar header para mostrar apenas o período selecionado
          return (
            <div style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {value.format('MMMM [de] YYYY')}
            </div>
          );
        }}
      />

      {/* Legenda */}
      <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
        <Badge status="success" text="Dia Trabalhado" />
        <Badge status="error" text="Falta" />
        <Badge status="warning" text="Atestado" />
        <Badge status="processing" text="Hora Extra" />
        <Badge status="default" text="Folga" />
      </div>
    </div>
  );
}

