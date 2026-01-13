'use client';

import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DetalhamentoDia } from '@/lib/schemas/turnoRealizadoSchema';
import StatusTag from './StatusTag';
import dayjs from 'dayjs';
import { useMemo } from 'react';

interface HistoricoTableProps {
  dados: DetalhamentoDia[];
  loading?: boolean;
  onVerDetalhes?: (dia: DetalhamentoDia) => void;
}

/**
 * Tabela de histórico detalhado por dia
 * Mostra apenas uma linha por dia com dias já realizados
 */
export default function HistoricoTable({
  dados,
  loading = false,
}: HistoricoTableProps) {
  // Agrupar por dia e filtrar apenas dias realizados
  const dadosAgrupados = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Agrupar por data
    const porData = new Map<string, DetalhamentoDia[]>();

    dados.forEach(dia => {
      const dataStr = dayjs(dia.data).format('YYYY-MM-DD');
      if (!porData.has(dataStr)) {
        porData.set(dataStr, []);
      }
      porData.get(dataStr)!.push(dia);
    });

    // Processar cada dia e criar uma linha consolidada
    const linhas: Array<{
      key: string;
      data: Date;
      tipo: string;
      descricao: string;
      equipe?: string;
      horasPrevistas: number;
      horasRealizadas: number;
      status?: string;
      tipoHoraExtra?: string;
    }> = [];

    porData.forEach((eventos, dataStr) => {
      const dataEvento = dayjs(dataStr).toDate();

      // Filtrar apenas dias já realizados (passados ou hoje)
      if (dataEvento > hoje) {
        return;
      }

      // Filtrar apenas eventos realizados (não apenas escala futura)
      const eventosRealizados = eventos.filter(
        e =>
          e.tipo === 'trabalho_realizado' ||
          e.tipo === 'falta' ||
          e.tipo === 'hora_extra' ||
          (e.tipo === 'escala_trabalho' &&
            eventos.some(
              ev => ev.tipo === 'trabalho_realizado' || ev.tipo === 'falta'
            ))
      );

      // Se não há eventos realizados, pular (não mostrar folgas futuras)
      if (eventosRealizados.length === 0) {
        return;
      }

      // Determinar o tipo principal do dia
      let tipoPrincipal = '';
      let descricao = '';
      let equipe: string | undefined;
      let status: string | undefined;
      let tipoHoraExtra: string | undefined;
      let horasPrevistas = 0;
      let horasRealizadas = 0;

      // Prioridade: falta > trabalho_realizado > hora_extra
      const falta = eventosRealizados.find(e => e.tipo === 'falta');
      const trabalho = eventosRealizados.find(
        e => e.tipo === 'trabalho_realizado'
      );
      const horaExtra = eventosRealizados.find(e => e.tipo === 'hora_extra');
      const escalaFolga = eventos.find(e => e.tipo === 'escala_folga');

      if (falta) {
        tipoPrincipal = 'falta';
        descricao = 'Falta em dia trabalhado';
        status = falta.status;
        horasPrevistas = falta.horasPrevistas || 0;
        horasRealizadas = falta.horasRealizadas || 0;
      } else if (horaExtra) {
        tipoPrincipal = 'hora_extra';
        if (escalaFolga) {
          descricao = 'Trabalhado na folga';
        } else {
          descricao = 'Hora Extra';
        }
        equipe = horaExtra.equipe?.nome;
        status = horaExtra.status;
        tipoHoraExtra = horaExtra.tipoHoraExtra;
        horasPrevistas = horaExtra.horasPrevistas || 0;
        horasRealizadas = horaExtra.horasRealizadas || 0;
      } else if (trabalho) {
        tipoPrincipal = 'trabalho';
        descricao = 'Trabalho normal';
        equipe = trabalho.equipe?.nome;
        horasPrevistas = trabalho.horasPrevistas || 0;
        horasRealizadas = trabalho.horasRealizadas || 0;
      } else {
        // Se não há evento realizado, não mostrar
        return;
      }

      linhas.push({
        key: dataStr,
        data: dataEvento,
        tipo: tipoPrincipal,
        descricao,
        equipe,
        horasPrevistas,
        horasRealizadas,
        status,
        tipoHoraExtra,
      });
    });

    // Ordenar por data (mais antigo primeiro)
    return linhas.sort((a, b) => a.data.getTime() - b.data.getTime());
  }, [dados]);
  const columns: ColumnsType<(typeof dadosAgrupados)[0]> = [
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => a.data.getTime() - b.data.getTime(),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      key: 'descricao',
      render: (descricao: string, record) => {
        let color = 'default';
        if (record.tipo === 'trabalho') color = 'success';
        if (record.tipo === 'falta') color = 'error';
        if (record.tipo === 'hora_extra') color = 'processing';
        return <Tag color={color}>{descricao}</Tag>;
      },
    },
    {
      title: 'Equipe',
      dataIndex: 'equipe',
      key: 'equipe',
      render: (equipe: string | undefined) =>
        equipe ? <Tag color='blue'>{equipe}</Tag> : '-',
    },
    {
      title: 'Horas Previstas',
      dataIndex: 'horasPrevistas',
      key: 'horasPrevistas',
      render: (horas: number) => (horas > 0 ? `${horas.toFixed(1)}h` : '-'),
      align: 'right',
    },
    {
      title: 'Horas Realizadas',
      dataIndex: 'horasRealizadas',
      key: 'horasRealizadas',
      render: (horas: number) => (horas > 0 ? `${horas.toFixed(1)}h` : '-'),
      align: 'right',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string | undefined, record) => {
        if (!status) return '-';
        if (record.tipo === 'falta') {
          return <StatusTag status={status} tipo='falta' />;
        }
        if (record.tipo === 'hora_extra') {
          return <StatusTag status={status} tipo='horaExtra' />;
        }
        return <StatusTag status={status} tipo='geral' />;
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={dadosAgrupados}
      loading={loading}
      pagination={false}
      size='small'
    />
  );
}
