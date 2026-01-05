/**
 * Componente de Cards de Estatísticas Reutilizável
 *
 * Este componente renderiza um grid de cards de estatísticas de forma padronizada,
 * eliminando código repetitivo em páginas como dashboard e histórico.
 *
 * FUNCIONALIDADES:
 * - Grid responsivo de cards
 * - Suporte a ícones, valores, títulos e cores customizadas
 * - Layout flexível com Col/Row do Ant Design
 * - Type safety completo
 *
 * BENEFÍCIOS:
 * - Elimina código repetitivo de cards de estatísticas
 * - Padroniza aparência e layout
 * - Facilita manutenção
 * - Layout responsivo automático
 *
 * EXEMPLO DE USO:
 * ```typescript
 * <StatsCards
 *   stats={[
 *     {
 *       title: 'Turnos Abertos',
 *       value: 15,
 *       icon: <ClockCircleOutlined />,
 *       valueStyle: { color: '#1890ff' }
 *     },
 *     {
 *       title: 'Turnos do Dia',
 *       value: 42,
 *       icon: <CalendarOutlined />
 *     }
 *   ]}
 * />
 * ```
 */

'use client';

import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import type { StatisticProps } from 'antd';

/**
 * Configuração de uma estatística
 */
export interface StatConfig {
  /**
   * Título da estatística
   */
  title: string;

  /**
   * Valor da estatística
   */
  value: number | string;

  /**
   * Ícone a exibir
   */
  icon?: React.ReactNode;

  /**
   * Estilo do valor
   */
  valueStyle?: React.CSSProperties;

  /**
   * Prefixo do valor (ex: R$, etc.)
   */
  prefix?: React.ReactNode;

  /**
   * Sufixo do valor (ex: %, etc.)
   */
  suffix?: React.ReactNode;

  /**
   * Se deve mostrar como loading
   */
  loading?: boolean;

  /**
   * Colspan customizado (padrão baseado em número de stats)
   */
  span?: number;
}

/**
 * Props do componente
 */
export interface StatsCardsProps {
  /**
   * Array de configurações de estatísticas
   */
  stats: StatConfig[];

  /**
   * Colspan padrão para cada card
   * Se não fornecido, calcula automaticamente baseado no número de stats
   */
  defaultSpan?: number;

  /**
   * Gutter entre cards
   * @default [16, 16]
   */
  gutter?: [number, number];

  /**
   * Estilo do container
   */
  style?: React.CSSProperties;
}

/**
 * Componente de cards de estatísticas reutilizável
 */
export default function StatsCards({
  stats,
  defaultSpan,
  gutter = [16, 16],
  style,
}: StatsCardsProps) {
  // Calcula span padrão se não fornecido
  const calculatedSpan = defaultSpan ?? (stats.length <= 4 ? 24 / stats.length : 6);

  return (
    <Row gutter={gutter} style={style}>
      {stats.map((stat, index) => {
        const span = stat.span ?? calculatedSpan;

        return (
          <Col key={index} xs={24} sm={12} md={span}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.prefix || stat.icon}
                suffix={stat.suffix}
                valueStyle={stat.valueStyle}
                loading={stat.loading}
              />
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}

