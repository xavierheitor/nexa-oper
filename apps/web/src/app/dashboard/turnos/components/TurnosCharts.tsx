import React from 'react';
import { Row, Col, Card, Empty, Spin } from 'antd';
import { Column } from '@ant-design/plots';
import {
  DadosGraficoTipoEquipe,
  DadosGraficoHora,
  DadosGraficoBase,
} from '../types';

interface TurnosChartsProps {
  dadosGrafico: DadosGraficoTipoEquipe[] | undefined;
  loadingGrafico: boolean;
  dadosGraficoHora: DadosGraficoHora[] | undefined;
  loadingGraficoHora: boolean;
  dadosGraficoBase: DadosGraficoBase[] | undefined;
  loadingGraficoBase: boolean;
  coresArray: string[];
}

export const TurnosCharts: React.FC<TurnosChartsProps> = ({
  dadosGrafico,
  loadingGrafico,
  dadosGraficoHora,
  loadingGraficoHora,
  dadosGraficoBase,
  loadingGraficoBase,
  coresArray,
}) => {
  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={7}>
          <Card title='Turnos por Tipo de Equipe'>
            {loadingGrafico ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size='large' />
              </div>
            ) : !dadosGrafico || dadosGrafico.length === 0 ? (
              <Empty description='Nenhum dado disponível' />
            ) : (
              <Column
                data={dadosGrafico}
                xField='tipo'
                yField='quantidade'
                height={300}
                columnWidthRatio={0.1}
                colorField='tipo'
                scale={{
                  color: {
                    range:
                      coresArray.length > 0
                        ? coresArray
                        : [
                            '#1890ff',
                            '#52c41a',
                            '#faad14',
                            '#f5222d',
                            '#722ed1',
                          ],
                  },
                }}
                label={{
                  text: 'quantidade',
                  position: 'top',
                  style: {
                    fill: '#000',
                    fontWeight: 'bold',
                  },
                }}
                xAxis={{
                  label: {
                    autoRotate: true,
                    autoHide: false,
                  },
                }}
                yAxis={{
                  tickCount: 5,
                  label: {
                    formatter: (text: string) => {
                      const num = parseFloat(text);
                      return Number.isInteger(num) ? num.toString() : '';
                    },
                  },
                }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={17}>
          <Card title='Turnos Diários por Hora'>
            {loadingGraficoHora ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size='large' />
              </div>
            ) : !dadosGraficoHora || dadosGraficoHora.length === 0 ? (
              <Empty description='Nenhum dado disponível' />
            ) : (
              <Column
                data={dadosGraficoHora}
                xField='hora'
                yField='quantidade'
                seriesField='tipo'
                colorField='tipo'
                height={300}
                isStack={true}
                scale={{
                  color: {
                    range:
                      coresArray.length > 0
                        ? coresArray
                        : [
                            '#1890ff',
                            '#52c41a',
                            '#faad14',
                            '#f5222d',
                            '#722ed1',
                          ],
                  },
                }}
                label={{
                  text: 'quantidade',
                  position: 'inside',
                  style: {
                    fill: '#fff',
                    fontWeight: 'bold',
                    fontSize: 10,
                  },
                }}
                legend={{
                  position: 'top',
                  itemName: {
                    formatter: (text: string) => {
                      // Não mostrar na legenda tipos que não têm dados
                      const temDados = dadosGraficoHora?.some(
                        d => d.tipo === text && d.quantidade > 0
                      );
                      return temDados ? text : '';
                    },
                  },
                }}
                xAxis={{
                  label: {
                    autoRotate: true,
                    autoHide: false,
                  },
                }}
                yAxis={{
                  tickCount: 5,
                  label: {
                    formatter: (text: string) => {
                      const num = parseFloat(text);
                      return Number.isInteger(num) ? num.toString() : '';
                    },
                  },
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title='Turnos Diários por Base'>
            {loadingGraficoBase ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size='large' />
              </div>
            ) : !dadosGraficoBase || dadosGraficoBase.length === 0 ? (
              <Empty description='Nenhum dado disponível' />
            ) : (
              <Column
                data={dadosGraficoBase}
                xField='base'
                yField='quantidade'
                seriesField='tipo'
                isStack={true}
                height={300}
                columnWidthRatio={0.3}
                label={{
                  text: (d: any) => (d.quantidade > 0 ? d.quantidade : ''),
                  position: 'inside',
                  style: {
                    fill: '#fff',
                    fontWeight: 'bold',
                    fontSize: 10,
                  },
                }}
                colorField='tipo'
                scale={{
                  color: {
                    range:
                      coresArray.length > 0
                        ? coresArray
                        : [
                            '#1890ff',
                            '#52c41a',
                            '#faad14',
                            '#f5222d',
                            '#722ed1',
                          ],
                  },
                }}
                legend={{
                  position: 'top',
                  itemName: {
                    formatter: (text: string) => {
                      // Não mostrar na legenda tipos que não têm dados
                      const temDados = dadosGraficoBase?.some(
                        d => d.tipo === text && d.quantidade > 0
                      );
                      return temDados ? text : '';
                    },
                  },
                }}
                xAxis={{
                  label: {
                    autoRotate: true,
                    autoHide: false,
                  },
                  type: 'category',
                }}
                yAxis={{
                  tickCount: 5,
                  label: {
                    formatter: (text: string) => {
                      const num = parseFloat(text);
                      return Number.isInteger(num) ? num.toString() : '';
                    },
                  },
                }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
};
