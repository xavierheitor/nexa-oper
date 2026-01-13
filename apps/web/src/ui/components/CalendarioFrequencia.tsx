'use client';

import { Calendar, Badge, Tooltip } from 'antd';
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

  // ✅ CORREÇÃO: Obter APENAS o evento mais relevante do dia
  const getListData = (value: Dayjs) => {
    const dataStr = value.format('YYYY-MM-DD');
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

    // Prioridade de exibição:
    // 1. Trabalho Realizado / Hora Extra (O que aconteceu de fato)
    // 2. Falta (Se não trabalhou)
    // 3. Escala Futura/Prevista (Se ainda não aconteceu)

    // Tenta achar trabalho realizado ou extra
    const trabalho = eventosDia.find(
      d => d.tipo === 'trabalho_realizado' || d.tipo === 'hora_extra'
    );

    if (trabalho) {
      // Se tem trabalho, mostra SÓ os dados do trabalho
      const type = trabalho.tipo === 'hora_extra' ? 'processing' : 'success';
      // Conteúdo principal deve ser a equipe
      const content = trabalho.equipe?.nome || 'Trabalhado';

      list.push({
        type,
        content,
        equipe: undefined, // Já está no content
        isEscala: false,
      });
      return list;
    }

    // Se não tem trabalho, verifica falta
    const falta = eventosDia.find(d => d.tipo === 'falta');
    if (falta) {
      const isAtestado = falta.status === 'justificada';
      list.push({
        type: isAtestado ? 'warning' : 'error',
        content: isAtestado ? 'Atestado' : 'Falta',
        isEscala: false,
      });
      return list;
    }

    // Se não tem nada realizado, mostra o previsto (escala)
    const escala = eventosDia.find(
      d =>
        d.tipo === 'escala_trabalho' ||
        d.tipo === 'escala_folga' ||
        d.tipo === 'folga'
    );

    if (escala) {
      if (escala.tipo === 'escala_folga' || escala.tipo === 'folga') {
        list.push({
          type: 'default',
          content: 'Folga',
          isEscala: true,
        });
      } else {
        // Escala de trabalho
        // Verificar se é futuro para adicionar "Previsto"
        const isFuturo = value.isAfter(dayjs(), 'day');
        const nomeEquipe = escala.equipe?.nome || 'Trabalho';
        const content = isFuturo ? `Previsto: ${nomeEquipe}` : nomeEquipe;

        list.push({
          type: 'default', // Neutro para futuro
          content,
          equipe: undefined,
          isEscala: true,
        });
      }
      return list;
    }

    return [];
  };

  // ✅ CORREÇÃO: Customizar célula mostrando APENAS o evento consolidado
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
      // Se tem escala mas não tem dados (e.g. futuro proximo sem slot gerado ainda? improvavel com a logica atual, mas ok), retornar vazio
      return null;
    }

    const item = listData[0]; // Agora sempre temos no máximo 1 item principal

    // Definir cor de fundo baseado no tipo do item
    let backgroundColor = 'transparent';
    if (item.type === 'success') backgroundColor = 'rgba(82, 196, 26, 0.2)';
    else if (item.type === 'error') backgroundColor = 'rgba(255, 77, 79, 0.2)';
    else if (item.type === 'processing')
      backgroundColor = 'rgba(24, 144, 255, 0.2)';
    else if (item.type === 'warning')
      backgroundColor = 'rgba(250, 219, 20, 0.2)';
    else if (item.type === 'default' && item.content === 'Folga')
      backgroundColor = 'rgba(140, 140, 140, 0.1)';

    // Buscar dados originais para tooltip (horas, etc)
    const eventosDia = consolidado.detalhamento.filter(
      d => dayjs(d.data).format('YYYY-MM-DD') === dataStr
    );
    // Tenta pegar o evento que gerou o item (trabalho, falta, ou escala)
    const eventoGerador = eventosDia.find(d => {
      if (item.type === 'success' || item.type === 'processing')
        return d.tipo === 'trabalho_realizado' || d.tipo === 'hora_extra';
      if (item.type === 'error') return d.tipo === 'falta';
      if (item.type === 'warning') return d.tipo === 'falta'; // atestado
      return d.tipo.startsWith('escala_') || d.tipo === 'folga';
    });

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
        <Tooltip
          title={
            <div>
              <div>{item.content}</div>
              {/* Se o content já é o nome da equipe, não precisa repetir */}
              {eventoGerador?.equipe?.nome &&
                item.content !== eventoGerador.equipe.nome && (
                  <div>Equipe: {eventoGerador.equipe.nome}</div>
                )}

              {eventoGerador && eventoGerador.horaInicio && (
                <div>
                  Início: {dayjs(eventoGerador.horaInicio).format('HH:mm')}
                </div>
              )}
              {eventoGerador && eventoGerador.horaFim && (
                <div>Fim: {dayjs(eventoGerador.horaFim).format('HH:mm')}</div>
              )}
              {eventoGerador && eventoGerador.horasRealizadas > 0 && (
                <div>Horas: {eventoGerador.horasRealizadas.toFixed(1)}h</div>
              )}
              {eventoGerador && eventoGerador.horasPrevistas > 0 && (
                <div>Previstas: {eventoGerador.horasPrevistas.toFixed(1)}h</div>
              )}
            </div>
          }
        >
          <Badge
            status={item.type as any}
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

        {/* Horários abaixo do badge se disponível */}
        {eventoGerador &&
          eventoGerador.horaInicio &&
          eventoGerador.horaFim &&
          !item.isEscala && (
            <div
              style={{
                fontSize: '10px',
                color: '#666',
                marginTop: '2px',
              }}
            >
              {dayjs(eventoGerador.horaInicio).format('HH:mm')} -{' '}
              {dayjs(eventoGerador.horaFim).format('HH:mm')}
            </div>
          )}

        {eventoGerador &&
          eventoGerador.horaInicio &&
          !eventoGerador.horaFim &&
          !item.isEscala && (
            <div
              style={{
                fontSize: '10px',
                color: '#666',
                marginTop: '2px',
              }}
            >
              Início: {dayjs(eventoGerador.horaInicio).format('HH:mm')}
            </div>
          )}
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
