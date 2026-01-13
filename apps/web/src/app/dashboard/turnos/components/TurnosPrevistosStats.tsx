import React from 'react';
import { Row, Col, Card, Statistic, Table } from 'antd';
import type { EstatisticasTurnosPrevistos } from '@/lib/types/turnoPrevisto';

interface TurnosPrevistosStatsProps {
  stats: EstatisticasTurnosPrevistos;
}

export const TurnosPrevistosStats: React.FC<TurnosPrevistosStatsProps> = ({
  stats,
}) => {
  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card.Meta
            title={
              <h3 style={{ margin: 0 }}>
                Turnos Previstos (Baseado em Escala)
              </h3>
            }
          />
        </Col>
        <Col xs={24} sm={12} md={6} lg={3}>
          <Card>
            <Statistic
              title='Turnos Previstos Hoje'
              value={stats.totalPrevistosHoje}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={3}>
          <Card>
            <Statistic
              title='Já Abertos'
              value={stats.totalAbertos}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={3}>
          <Card>
            <Statistic
              title='Não Abertos'
              value={stats.totalNaoAbertos}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={3}>
          <Card>
            <Statistic
              title='Aderentes'
              value={stats.totalAderentes}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={3}>
          <Card>
            <Statistic
              title='Não Aderentes'
              value={stats.totalNaoAderentes}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={3}>
          <Card>
            <Statistic
              title='Turnos Extras'
              value={stats.totalTurnosExtras}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={3}>
          <Card>
            <Statistic
              title='Previstos até Agora'
              value={stats.previstosAteAgora}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={3}>
          <Card>
            <Statistic
              title='Abertos até Agora'
              value={stats.abertosAteAgora}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {stats.porTipoEquipe.length > 0 && (
        <Card
          title='Turnos Previstos por Tipo de Equipe'
          style={{ marginBottom: 24 }}
        >
          <Table
            dataSource={stats.porTipoEquipe}
            rowKey='tipoEquipeId'
            pagination={false}
            columns={[
              {
                title: 'Tipo de Equipe',
                dataIndex: 'tipoEquipeNome',
                key: 'tipoEquipeNome',
              },
              {
                title: 'Previstos',
                dataIndex: 'previstos',
                key: 'previstos',
                align: 'center',
              },
              {
                title: 'Abertos',
                dataIndex: 'abertos',
                key: 'abertos',
                align: 'center',
                render: (value: number) => (
                  <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    {value}
                  </span>
                ),
              },
              {
                title: 'Não Abertos',
                dataIndex: 'naoAbertos',
                key: 'naoAbertos',
                align: 'center',
                render: (value: number) => (
                  <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                    {value}
                  </span>
                ),
              },
            ]}
          />
        </Card>
      )}
    </>
  );
};
