'use client';

import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, CloseCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { ConsolidadoEletricistaResponse } from '@/lib/schemas/turnoRealizadoSchema';

interface ConsolidadoEletricistaCardProps {
  resumo: ConsolidadoEletricistaResponse['resumo'];
  loading?: boolean;
}

/**
 * Componente de cards com resumo de frequência do eletricista
 */
export default function ConsolidadoEletricistaCard({
  resumo,
  loading = false,
}: ConsolidadoEletricistaCardProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="Dias Trabalhados"
            value={resumo.diasTrabalhados}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="Faltas"
            value={resumo.faltas}
            prefix={<CloseCircleOutlined />}
            valueStyle={{ color: '#cf1322' }}
            suffix={
              resumo.faltasPendentes > 0 ? (
                <span style={{ fontSize: '12px', color: '#fa8c16' }}>
                  ({resumo.faltasPendentes} pendentes)
                </span>
              ) : null
            }
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="Horas Extras"
            value={resumo.horasExtras.toFixed(1)}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#1890ff' }}
            suffix="h"
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading}>
          <Statistic
            title="Atrasos"
            value={resumo.atrasos}
            prefix={<WarningOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>
    </Row>
  );
}

