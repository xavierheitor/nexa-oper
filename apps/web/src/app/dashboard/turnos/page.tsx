'use client';

/**
 * Página de Turnos
 *
 * Dashboard com informações sobre turnos abertos, incluindo:
 * - Total de turnos abertos
 * - Turnos abertos por base
 * - Tabela com detalhes dos turnos abertos
 */

import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, Spin, Empty, Typography, Space } from 'antd';
import { ClockCircleOutlined, TeamOutlined, CarOutlined, EnvironmentOutlined, CalendarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { listTurnos } from '@/lib/actions/turno/list';

const { Title } = Typography;

/**
 * Interface para dados do turno
 */
interface TurnoData {
  id: number;
  dataSolicitacao: string;
  dataInicio: string;
  dataFim?: string;
  veiculoId: number;
  veiculoPlaca: string;
  veiculoModelo: string;
  equipeId: number;
  equipeNome: string;
  dispositivo: string;
  kmInicio: number;
  kmFim?: number;
  status: string;
  eletricistas: Array<{
    id: number;
    nome: string;
    matricula: string;
  }>;
}

export default function TurnosPage() {
  const [turnosAbertos, setTurnosAbertos] = useState<TurnoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    totalDiarios: 0,
    porBase: {} as Record<string, number>,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar turnos abertos
        const resultAbertos = await listTurnos({
          page: 1,
          pageSize: 1000,
          status: 'ABERTO',
        });

        // Buscar todos os turnos do dia (início do dia até agora)
        const hoje = new Date();
        const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
        const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

        const resultTodos = await listTurnos({
          page: 1,
          pageSize: 1000,
          dataInicio: inicioHoje,
          dataFim: fimHoje,
        });

        if (resultAbertos.success && resultAbertos.data) {
          const turnos = resultAbertos.data.data || [];
          setTurnosAbertos(turnos);

          // Calcular estatísticas
          const porBase: Record<string, number> = {};
          turnos.forEach((turno: any) => {
            const base = turno.equipe?.nome?.split('-')[0] || 'Não identificada';
            porBase[base] = (porBase[base] || 0) + 1;
          });

          // Contar turnos diários
          const totalDiarios = resultTodos.success && resultTodos.data ? (resultTodos.data.data?.length || 0) : 0;

          setStats({
            total: turnos.length,
            totalDiarios,
            porBase,
          });
        }
      } catch (error) {
        console.error('Erro ao carregar turnos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const columns: ColumnsType<TurnoData> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Veículo',
      key: 'veiculo',
      render: (_: unknown, record: TurnoData) => (
        <Space direction="vertical" size={0}>
          <span><strong>{record.veiculo.placa}</strong></span>
          <span style={{ fontSize: '12px', color: '#666' }}>{record.veiculo.modelo}</span>
        </Space>
      ),
    },
    {
      title: 'Equipe',
      dataIndex: ['equipe', 'nome'],
      key: 'equipe',
    },
    {
      title: 'Eletricistas',
      key: 'eletricistas',
      render: (_: unknown, record: TurnoData) => (
        <Space direction="vertical" size={0}>
          {record.eletricistas?.map((elet) => (
            <span key={elet.id}>{elet.nome}</span>
          ))}
        </Space>
      ),
    },
    {
      title: 'Data/Hora Início',
      key: 'dataInicio',
      render: (_: unknown, record: TurnoData) => {
        const data = new Date(record.dataInicio);
        return (
          <span>
            {data.toLocaleDateString('pt-BR')} {data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      },
    },
    {
      title: 'KM Início',
      dataIndex: 'kmInicio',
      key: 'kmInicio',
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'ABERTO' ? 'green' : 'default'}>
          {status}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Turnos Abertos</Title>

      {/* Estatísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total de Turnos Abertos"
              value={stats.total}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Turnos Diários"
              value={stats.totalDiarios}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>

        {Object.entries(stats.porBase).map(([base, quantidade]) => (
          <Col xs={24} sm={12} lg={6} key={base}>
            <Card>
              <Statistic
                title={`${base}`}
                value={quantidade}
                prefix={<EnvironmentOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Tabela de Turnos */}
      <Card>
        <Table
          columns={columns}
          dataSource={turnosAbertos}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total de ${total} turnos`,
          }}
          locale={{
            emptyText: <Empty description="Nenhum turno aberto no momento" />,
          }}
        />
      </Card>
    </div>
  );
}
