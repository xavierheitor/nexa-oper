import React, { useMemo, useState } from 'react';
import { Card, Select, Table, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TurnoPrevisto } from '@/lib/types/turnoPrevisto';
import { formatTime } from '@/lib/utils/turnoPrevistoHelpers';

const { Text } = Typography;

interface TurnosMatrixTableProps {
  turnosPrevistos: TurnoPrevisto[];
  tiposEquipeData: Array<{ id: number; nome: string }> | undefined;
}

export const TurnosMatrixTable: React.FC<TurnosMatrixTableProps> = ({
  turnosPrevistos,
  tiposEquipeData,
}) => {
  const [filtroTipoEquipe, setFiltroTipoEquipe] = useState<string | undefined>(
    undefined
  );

  // 1. Filtrar dados
  const filteredTurnos = useMemo(() => {
    if (!filtroTipoEquipe) return turnosPrevistos;
    return turnosPrevistos.filter(t => t.tipoEquipeNome === filtroTipoEquipe);
  }, [turnosPrevistos, filtroTipoEquipe]);

  // 2. Extrair Bases (Colunas) e Horários (Linhas) únicos
  const { bases, matrixData } = useMemo(() => {
    const basesSet = new Set<string>();
    const horariosSet = new Set<string>();

    // Mapeamento: Horario -> Base -> Count
    const map = new Map<string, Map<string, number>>();

    filteredTurnos.forEach(turno => {
      const base = turno.baseNome || 'Sem Base';
      const horario = turno.horarioPrevisto
        ? formatTime(turno.horarioPrevisto)
        : 'Sem Horário';

      basesSet.add(base);
      horariosSet.add(horario);

      if (!map.has(horario)) {
        map.set(horario, new Map());
      }

      const counts = map.get(horario)!;
      counts.set(base, (counts.get(base) || 0) + 1);
    });

    // Ordenar
    const sortedBases = Array.from(basesSet).sort();
    // Ordenar horários (tratar 'Sem Horário' para ficar no fim ou algo assim, mas normalmente HH:mm ordena bem string)
    const sortedHorarios = Array.from(horariosSet).sort();

    // Criar DataSource para a tabela
    const data = sortedHorarios.map(horario => {
      const row: any = { key: horario, horario };
      let totalRow = 0;

      sortedBases.forEach(base => {
        const count = map.get(horario)?.get(base) || 0;
        row[base] = count > 0 ? count : '-'; // Mostra traço se zero para limpar visual
        totalRow += count;
      });

      row.total = totalRow;
      return row;
    });

    return { bases: sortedBases, horarios: sortedHorarios, matrixData: data };
  }, [filteredTurnos]);

  // 3. Definir Colunas
  const columns: ColumnsType<any> = useMemo(() => {
    const baseCols: ColumnsType<any> = bases.map(base => ({
      title: base,
      dataIndex: base,
      key: base,
      align: 'center',
      width: 100,
      render: val => <Text strong={val !== '-'}>{val}</Text>,
    }));

    return [
      {
        title: 'Horário',
        dataIndex: 'horario',
        key: 'horario',
        fixed: 'left',
        width: 100,
        align: 'center',
        render: (text: string) => <Text strong>{text}</Text>,
        sorter: (a, b) => a.horario.localeCompare(b.horario),
      },
      ...baseCols,
      {
        title: 'Total',
        dataIndex: 'total',
        key: 'total',
        fixed: 'right',
        width: 80,
        align: 'center',
        render: val => <Text strong>{val}</Text>,
      },
    ];
  }, [bases]);

  // Totais da ultima linha (Total geral por base)
  const footerData = useMemo(() => {
    if (!bases.length) return null;

    return (
      <Table.Summary fixed>
        <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
          <Table.Summary.Cell index={0} align='center'>
            <Text strong>Total</Text>
          </Table.Summary.Cell>
          {bases.map((base, idx) => {
            const totalBase = filteredTurnos.filter(
              t => (t.baseNome || 'Sem Base') === base
            ).length;
            return (
              <Table.Summary.Cell key={base} index={idx + 1} align='center'>
                <Text strong>{totalBase}</Text>
              </Table.Summary.Cell>
            );
          })}
          <Table.Summary.Cell index={bases.length + 1} align='center'>
            <Text strong>{filteredTurnos.length}</Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  }, [bases, filteredTurnos]);

  return (
    <Card
      title='Matriz de Turnos Previstos (Horário x Base)'
      extra={
        <Space>
          <span style={{ fontSize: 14 }}>Tipo de Equipe:</span>
          <Select
            placeholder='Todos'
            allowClear
            style={{ width: 220 }}
            value={filtroTipoEquipe}
            onChange={setFiltroTipoEquipe}
            options={tiposEquipeData?.map(t => ({
              label: t.nome,
              value: t.nome,
            }))}
          />
        </Space>
      }
      style={{ marginTop: 24, marginBottom: 24 }}
    >
      <Table
        dataSource={matrixData}
        columns={columns}
        pagination={false}
        size='small'
        scroll={{ x: 'max-content', y: 400 }}
        summary={() => footerData}
        bordered
      />
    </Card>
  );
};
