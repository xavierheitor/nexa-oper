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

    // Mapeamento: Horario -> Base -> { previsto: number, realizado: number }
    const map = new Map<
      string,
      Map<string, { previsto: number; realizado: number }>
    >();

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

      const countsMap = map.get(horario)!;
      if (!countsMap.has(base)) {
        countsMap.set(base, { previsto: 0, realizado: 0 });
      }

      const entry = countsMap.get(base)!;
      entry.previsto += 1;

      // Considera realizado se status não for NAO_ABERTO
      if (turno.status !== 'NAO_ABERTO') {
        entry.realizado += 1;
      }
    });

    // Ordenar
    const sortedBases = Array.from(basesSet).sort();
    const sortedHorarios = Array.from(horariosSet).sort();

    // Criar DataSource para a tabela
    const data = sortedHorarios.map(horario => {
      const row: any = { key: horario, horario };
      let totalPrevistoRow = 0;
      let totalRealizadoRow = 0;

      sortedBases.forEach(base => {
        const counts = map.get(horario)?.get(base) || {
          previsto: 0,
          realizado: 0,
        };
        // Armazena objeto completo para o render
        row[base] = counts;

        totalPrevistoRow += counts.previsto;
        totalRealizadoRow += counts.realizado;
      });

      row.total = { previsto: totalPrevistoRow, realizado: totalRealizadoRow };
      return row;
    });

    return { bases: sortedBases, horarios: sortedHorarios, matrixData: data };
  }, [filteredTurnos]);

  // 3. Definir Colunas
  const columns: ColumnsType<any> = useMemo(() => {
    const renderCell = (val: { previsto: number; realizado: number }) => {
      if (!val || (val.previsto === 0 && val.realizado === 0)) return '-';

      let color = '#52c41a'; // Verde (Igual)
      if (val.realizado < val.previsto) color = '#f5222d'; // Vermelho
      if (val.realizado > val.previsto) color = '#1890ff'; // Azul

      return (
        <Space size={4}>
          <Text>{val.previsto}</Text>
          <Text strong style={{ color }}>
            ({val.realizado})
          </Text>
        </Space>
      );
    };

    const baseCols: ColumnsType<any> = bases.map(base => ({
      title: base,
      dataIndex: base,
      key: base,
      align: 'center',
      width: 100,
      render: renderCell,
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
        width: 100,
        align: 'center',
        render: renderCell,
      },
    ];
  }, [bases]);

  // Totais da ultima linha (Total geral por base)
  const footerData = useMemo(() => {
    if (!bases.length) return null;

    // Função helper para renderizar célula do rodapé
    const renderFooterCell = (previsto: number, realizado: number) => {
      let color = '#52c41a'; // Verde (Igual)
      if (realizado < previsto) color = '#f5222d'; // Vermelho
      if (realizado > previsto) color = '#1890ff'; // Azul

      // Se não tem nada previsto nem realizado, traço
      if (previsto === 0 && realizado === 0) return '-';

      return (
        <Space size={4}>
          <Text strong>{previsto}</Text>
          <Text strong style={{ color }}>
            ({realizado})
          </Text>
        </Space>
      );
    };

    return (
      <Table.Summary fixed>
        <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
          <Table.Summary.Cell index={0} align='center'>
            <Text strong>Total</Text>
          </Table.Summary.Cell>
          {bases.map((base, idx) => {
            const turnosDaBase = filteredTurnos.filter(
              t => (t.baseNome || 'Sem Base') === base
            );
            const totalPrevisto = turnosDaBase.length;
            const totalRealizado = turnosDaBase.filter(
              t => t.status !== 'NAO_ABERTO'
            ).length;

            return (
              <Table.Summary.Cell key={base} index={idx + 1} align='center'>
                {renderFooterCell(totalPrevisto, totalRealizado)}
              </Table.Summary.Cell>
            );
          })}
          <Table.Summary.Cell index={bases.length + 1} align='center'>
            {renderFooterCell(
              filteredTurnos.length,
              filteredTurnos.filter(t => t.status !== 'NAO_ABERTO').length
            )}
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  }, [bases, filteredTurnos]);

  return (
    <Card
      title='Matriz de Turnos Previstos (Horário x Base)'
      extra={
        <Space wrap>
          <Space size={4} style={{ marginRight: 16 }}>
            <span style={{ fontSize: 12, color: '#666' }}>Legenda:</span>
            <Text strong style={{ fontSize: 12 }}>
              Previsto
            </Text>
            <Text style={{ fontSize: 12 }}>(Realizado:</Text>
            <Text strong style={{ fontSize: 12, color: '#f5222d' }}>
              &lt;
            </Text>
            <Text strong style={{ fontSize: 12, color: '#52c41a' }}>
              =
            </Text>
            <Text strong style={{ fontSize: 12, color: '#1890ff' }}>
              &gt;
            </Text>
            <Text style={{ fontSize: 12 }}>)</Text>
          </Space>
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
