import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';

interface TurnosKPIsProps {
  stats: {
    total: number;
    totalDiarios: number;
  };
}

export const TurnosKPIs: React.FC<TurnosKPIsProps> = ({ stats }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12}>
        <Card>
          <Statistic
            title='Turnos Abertos no momento'
            value={stats.total}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12}>
        <Card>
          <Statistic
            title='Aberturas totais do dia'
            value={stats.totalDiarios}
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
    </Row>
  );
};
