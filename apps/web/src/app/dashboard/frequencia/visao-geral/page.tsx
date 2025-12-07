'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, Space, DatePicker, Select, Button, Spin, message, Row, Col, Statistic, Tag, Empty } from 'antd';
import { App } from 'antd';
import { UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { getConsolidadoEletricista } from '@/lib/actions/turno-realizado/getConsolidadoEletricista';
import { listEletricistas } from '@/lib/actions/eletricista/list';
import { ConsolidadoEletricistaResponse } from '@/lib/schemas/turnoRealizadoSchema';
import ConsolidadoEletricistaCard from '@/ui/components/ConsolidadoEletricistaCard';
import HistoricoTable from '@/ui/components/HistoricoTable';
import CalendarioFrequencia from '@/ui/components/CalendarioFrequencia';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import useSWR from 'swr';
import dayjs, { Dayjs } from 'dayjs';
import { errorHandler } from '@/lib/utils/errorHandler';

const { RangePicker } = DatePicker;

/**
 * Página de Visão Geral de Frequência
 *
 * Permite visualizar um resumo completo da frequência de um eletricista
 * com filtros de período, mostrando dias trabalhados, faltas, atestados,
 * horas extras, etc.
 */
export default function FrequenciaVisaoGeralPage() {
  const { message: messageApi } = App.useApp();

  // Estados para filtros
  const [eletricistaId, setEletricistaId] = useState<number | undefined>(undefined);
  const [dataInicio, setDataInicio] = useState<Date | undefined>(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1); // Início do mês
  });
  const [dataFim, setDataFim] = useState<Date | undefined>(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59); // Fim do mês
  });

  // Carregar lista de eletricistas para o select
  const eletricistasFetcher = useMemo(
    () => async () => {
      const result = await listEletricistas({
        page: 1,
        pageSize: 1000, // Buscar muitos para o select
        orderBy: 'nome',
        orderDir: 'asc',
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao carregar eletricistas');
      }

      return result.data.data || [];
    },
    []
  );

  const { data: eletricistasData, loading: loadingEletricistas } = useDataFetch(
    eletricistasFetcher,
    []
  );

  // Garantir que eletricistas seja sempre um array
  const eletricistas = eletricistasData || [];

  // Fetcher para dados consolidados
  const consolidadoFetcher = async (): Promise<ConsolidadoEletricistaResponse> => {
    if (!eletricistaId) {
      throw new Error('Selecione um eletricista');
    }

    if (!dataInicio || !dataFim) {
      throw new Error('Selecione o período');
    }

    const result = await getConsolidadoEletricista({
      eletricistaId,
      periodo: 'custom',
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim.toISOString(),
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar dados consolidados');
    }

    if (!result.data) {
      throw new Error('Dados não retornados');
    }

    return result.data;
  };

  const {
    data: consolidado,
    error,
    isLoading: loadingConsolidado,
    mutate,
  } = useSWR<ConsolidadoEletricistaResponse>(
    eletricistaId && dataInicio && dataFim
      ? ['frequencia-visao-geral', eletricistaId, dataInicio, dataFim]
      : null,
    consolidadoFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (error) {
      errorHandler.log(error, 'FrequenciaVisaoGeralPage');
      messageApi.error(error.message || 'Erro ao carregar dados de frequência');
    }
  }, [error, messageApi]);

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDataInicio(dates[0].toDate());
      setDataFim(dates[1].toDate());
    } else {
      setDataInicio(undefined);
      setDataFim(undefined);
    }
  };

  const handleBuscar = () => {
    if (!eletricistaId) {
      messageApi.warning('Selecione um eletricista');
      return;
    }
    if (!dataInicio || !dataFim) {
      messageApi.warning('Selecione o período');
      return;
    }
    mutate();
  };

  const estatisticasDetalhadas = useMemo(() => {
    if (!consolidado) return null;

    const { resumo, detalhamento } = consolidado;

    // Calcular dias por tipo
    const diasPorTipo = detalhamento.reduce(
      (acc, dia) => {
        if (dia.tipo === 'trabalho') acc.trabalhados++;
        if (dia.tipo === 'falta') acc.faltas++;
        if (dia.tipo === 'hora_extra') acc.horasExtras++;
        if (dia.tipo === 'folga') acc.folgas++;
        return acc;
      },
      { trabalhados: 0, faltas: 0, horasExtras: 0, folgas: 0 }
    );

    // Contar atestados (faltas justificadas)
    const atestados = detalhamento.filter(
      (dia) => dia.tipo === 'falta' && dia.status === 'justificada'
    ).length;

    // Calcular total de horas
    const totalHorasPrevistas = detalhamento.reduce(
      (acc, dia) => acc + (dia.horasPrevistas || 0),
      0
    );
    const totalHorasRealizadas = detalhamento.reduce(
      (acc, dia) => acc + (dia.horasRealizadas || 0),
      0
    );

    return {
      ...diasPorTipo,
      atestados,
      totalHorasPrevistas,
      totalHorasRealizadas,
    };
  }, [consolidado]);

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <CalendarOutlined />
            Visão Geral de Frequência
          </Space>
        }
        extra={
          <Space>
            <Select
              placeholder="Selecione o eletricista"
              showSearch
              allowClear
              style={{ width: 300 }}
              loading={loadingEletricistas}
              value={eletricistaId}
              onChange={(value) => setEletricistaId(value)}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={Array.isArray(eletricistas) ? eletricistas.map((e) => ({
                value: e.id,
                label: `${e.nome} (${e.matricula})`,
              })) : []}
              suffixIcon={<UserOutlined />}
            />
            <RangePicker
              value={
                dataInicio && dataFim
                  ? [dayjs(dataInicio), dayjs(dataFim)]
                  : null
              }
              onChange={handleRangeChange}
              format="DD/MM/YYYY"
              placeholder={['Data início', 'Data fim']}
            />
            <Button
              type="primary"
              onClick={handleBuscar}
              loading={loadingConsolidado}
              disabled={!eletricistaId || !dataInicio || !dataFim}
            >
              Buscar
            </Button>
          </Space>
        }
      >
        {!eletricistaId || !dataInicio || !dataFim ? (
          <Empty
            description="Selecione um eletricista e período para visualizar os dados"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : loadingConsolidado && !consolidado ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : error && !consolidado ? (
          <Card>
            <p style={{ color: 'red' }}>Erro ao carregar dados: {error.message}</p>
          </Card>
        ) : consolidado ? (
          <>
            {/* Informações do Eletricista e Período */}
            <Card
              size="small"
              style={{ marginBottom: 24, backgroundColor: '#f5f5f5' }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Eletricista"
                    value={consolidado.eletricista.nome}
                    prefix={<UserOutlined />}
                    suffix={
                      <Tag color="blue">{consolidado.eletricista.matricula}</Tag>
                    }
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Período"
                    value={`${dayjs(consolidado.periodo.dataInicio).format('DD/MM/YYYY')} - ${dayjs(consolidado.periodo.dataFim).format('DD/MM/YYYY')}`}
                    prefix={<CalendarOutlined />}
                  />
                </Col>
              </Row>
            </Card>

            {/* Resumo Consolidado */}
            <Card
              title="Resumo Consolidado"
              style={{ marginBottom: 24 }}
            >
              <ConsolidadoEletricistaCard
                resumo={consolidado.resumo}
                loading={loadingConsolidado}
              />
            </Card>

            {/* Estatísticas Detalhadas */}
            {estatisticasDetalhadas && (
              <Card
                title="Estatísticas Detalhadas"
                style={{ marginBottom: 24 }}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Dias Trabalhados"
                        value={estatisticasDetalhadas.trabalhados}
                        suffix="dias"
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Faltas"
                        value={estatisticasDetalhadas.faltas}
                        suffix="dias"
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Atestados"
                        value={estatisticasDetalhadas.atestados}
                        suffix="dias"
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Horas Extras"
                        value={estatisticasDetalhadas.horasExtras}
                        suffix="dias"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Folgas"
                        value={estatisticasDetalhadas.folgas}
                        suffix="dias"
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Horas Previstas"
                        value={estatisticasDetalhadas.totalHorasPrevistas.toFixed(1)}
                        suffix="h"
                        valueStyle={{ color: '#595959' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Horas Realizadas"
                        value={estatisticasDetalhadas.totalHorasRealizadas.toFixed(1)}
                        suffix="h"
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card size="small">
                      <Statistic
                        title="Diferença"
                        value={(
                          estatisticasDetalhadas.totalHorasRealizadas -
                          estatisticasDetalhadas.totalHorasPrevistas
                        ).toFixed(1)}
                        suffix="h"
                        valueStyle={{
                          color:
                            estatisticasDetalhadas.totalHorasRealizadas -
                              estatisticasDetalhadas.totalHorasPrevistas >=
                            0
                              ? '#3f8600'
                              : '#cf1322',
                        }}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Histórico Detalhado */}
            <Card title="Histórico Detalhado por Dia" style={{ marginBottom: 24 }}>
              <HistoricoTable
                dados={consolidado.detalhamento}
                loading={loadingConsolidado}
              />
            </Card>

            {/* Calendário de Frequência */}
            <Card title="Calendário de Frequência">
              <CalendarioFrequencia
                consolidado={consolidado}
                dataInicio={dataInicio}
                dataFim={dataFim}
              />
            </Card>
          </>
        ) : null}
      </Card>
    </div>
  );
}

