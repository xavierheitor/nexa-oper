'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Table, Spin, DatePicker, Space, Button, message } from 'antd';
import { App } from 'antd';
import { getConsolidadoEquipe } from '@/lib/actions/turno-realizado/getConsolidadoEquipe';
import { ConsolidadoEquipeResponse } from '@/lib/schemas/turnoRealizadoSchema';
import useSWR from 'swr';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { LinkOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { RangePicker } = DatePicker;

/**
 * Dashboard de frequência por equipe
 */
export default function FrequenciaEquipePage() {
  const params = useParams();
  const equipeId = Number(params.id);
  const { message: messageApi } = App.useApp();

  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);

  const [dataInicio, setDataInicio] = useState<Date>(inicioMes);
  const [dataFim, setDataFim] = useState<Date>(fimMes);

  // Fetcher para SWR
  const fetcher = async () => {
    const result = await getConsolidadoEquipe({
      equipeId,
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim.toISOString(),
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar dados');
    }

    return result.data;
  };

  const { data, error, isLoading } = useSWR<ConsolidadoEquipeResponse>(
    ['frequencia-equipe', equipeId, dataInicio, dataFim],
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDataInicio(dates[0].toDate());
      setDataFim(dates[1].toDate());
    }
  };

  const columns: ColumnsType<ConsolidadoEquipeResponse['eletricistas'][0]> = [
    {
      title: 'Eletricista',
      key: 'eletricista',
      render: (_, record) => (
        <Link href={`/dashboard/frequencia/eletricista/${record.eletricista.id}`}>
          {record.eletricista.nome} ({record.eletricista.matricula})
        </Link>
      ),
      sorter: (a, b) => a.eletricista.nome.localeCompare(b.eletricista.nome),
    },
    {
      title: 'Dias Trabalhados',
      dataIndex: ['resumo', 'diasTrabalhados'],
      key: 'diasTrabalhados',
      align: 'right',
      sorter: (a, b) => a.resumo.diasTrabalhados - b.resumo.diasTrabalhados,
    },
    {
      title: 'Faltas',
      dataIndex: ['resumo', 'faltas'],
      key: 'faltas',
      align: 'right',
      sorter: (a, b) => a.resumo.faltas - b.resumo.faltas,
    },
    {
      title: 'Horas Extras',
      dataIndex: ['resumo', 'horasExtras'],
      key: 'horasExtras',
      align: 'right',
      render: (horas: number) => `${horas.toFixed(1)}h`,
      sorter: (a, b) => a.resumo.horasExtras - b.resumo.horasExtras,
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => (
        <Link href={`/dashboard/frequencia/eletricista/${record.eletricista.id}`}>
          <Button type="link" icon={<LinkOutlined />} size="small">
            Ver Detalhes
          </Button>
        </Link>
      ),
    },
  ];

  if (isLoading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <p>Erro ao carregar dados: {error.message}</p>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={`Frequência - ${data.equipe.nome}`}
        extra={
          <Space>
            <RangePicker
              value={[dayjs(dataInicio), dayjs(dataFim)]}
              onChange={handleRangeChange}
              format="DD/MM/YYYY"
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data.eletricistas}
          rowKey={(record) => record.eletricista.id}
          loading={isLoading}
          pagination={false}
        />
      </Card>
    </div>
  );
}

