/**
 * Wizard de Criação de Período de Escala
 *
 * Fluxo guiado em 3 passos para criar escalas completas
 */

'use client';

import React, { useState } from 'react';
import { Steps, Form, Select, DatePicker, Button, Space, message, Alert, Card, Input } from 'antd';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { listEquipes } from '@/lib/actions/equipe/list';
import { listTiposEscala } from '@/lib/actions/escala/tipoEscala';
import { listEletricistas } from '@/lib/actions/eletricista/list';
import {
  createEscalaEquipePeriodo,
  gerarSlotsEscala,
  atribuirEletricistas,
} from '@/lib/actions/escala/escalaEquipePeriodo';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface EscalaWizardProps {
  onFinish: () => void;
  onCancel: () => void;
}

export default function EscalaWizard({ onFinish, onCancel }: EscalaWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Dados do período criado
  const [periodoId, setPeriodoId] = useState<number | null>(null);
  const [tipoEscalaSelecionado, setTipoEscalaSelecionado] = useState<any>(null);
  const [periodoInicio, setPeriodoInicio] = useState<Date | null>(null);
  const [periodoFim, setPeriodoFim] = useState<Date | null>(null);

  // Eletricistas selecionados
  const [selectedEletricistas, setSelectedEletricistas] = useState<number[]>([]);
  const [proximasFolgas, setProximasFolgas] = useState<Record<number, Date>>({});

  // Carregar equipes
  const { data: equipes, isLoading: equipesLoading } = useEntityData({
    key: 'equipes-wizard',
    fetcher: async () => {
      const result = await listEquipes({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
      });
      return result.success && result.data ? result.data.data : [];
    },
    paginationEnabled: false,
  });

  // Carregar tipos de escala
  const { data: tiposEscala, isLoading: tiposLoading } = useEntityData({
    key: 'tipos-escala-wizard',
    fetcher: async () => {
      const result = await listTiposEscala({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
        ativo: true,
      });
      return result.success && result.data ? result.data.data : [];
    },
    paginationEnabled: false,
  });

  // Carregar eletricistas
  const { data: eletricistas, isLoading: eletricistasLoading } = useEntityData({
    key: 'eletricistas-wizard',
    fetcher: async () => {
      const result = await listEletricistas({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
      });
      return result.success && result.data ? result.data.data : [];
    },
    paginationEnabled: false,
  });

  // Determinar quantos eletricistas são necessários
  const getQtdEletricistasNecessarios = () => {
    if (!tipoEscalaSelecionado) return 2;
    return tipoEscalaSelecionado.minEletricistasPorTurno || 2;
  };

  const isCiclo = () => tipoEscalaSelecionado?.modoRepeticao === 'CICLO_DIAS';

  // Step 1: Criar período
  const handleStep1Next = async () => {
    try {
      const values = await form.validateFields(['equipeId', 'tipoEscalaId', 'periodo', 'observacoes']);
      setLoading(true);

      const submitData = {
        equipeId: values.equipeId,
        tipoEscalaId: values.tipoEscalaId,
        periodoInicio: values.periodo[0].toDate(),
        periodoFim: values.periodo[1].toDate(),
        observacoes: values.observacoes,
      };

      const result = await createEscalaEquipePeriodo(submitData);

      if (result.success && result.data) {
        setPeriodoId(result.data.id);
        setPeriodoInicio(submitData.periodoInicio);
        setPeriodoFim(submitData.periodoFim);
        message.success('Período de escala criado!');
        setCurrentStep(1);
      } else {
        message.error(result.error || 'Erro ao criar período');
      }
    } catch (error) {
      console.error('Erro na validação:', error);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Atribuir eletricistas
  const handleStep2Next = async () => {
    if (!periodoId) return;

    const qtdNecessaria = getQtdEletricistasNecessarios();

    if (selectedEletricistas.length !== qtdNecessaria) {
      message.warning(`Selecione exatamente ${qtdNecessaria} eletricistas`);
      return;
    }

    // Validar datas de folga para escala com ciclo
    if (isCiclo()) {
      const faltamDatas = selectedEletricistas.some(id => !proximasFolgas[id]);
      if (faltamDatas) {
        message.warning('Informe a data da próxima folga para todos os eletricistas');
        return;
      }
    }

    setLoading(true);
    try {
      // Montar dados dos eletricistas
      const eletricistasData = isCiclo()
        ? selectedEletricistas.map(id => ({
            eletricistaId: id,
            proximaFolga: proximasFolgas[id],
          }))
        : selectedEletricistas.map(id => ({
            eletricistaId: id,
            proximaFolga: periodoInicio!, // Não importa para Espanhola
          }));

      // Atribuir eletricistas
      const result = await atribuirEletricistas({
        escalaEquipePeriodoId: periodoId,
        eletricistas: eletricistasData,
      });

      if (result.success && result.data) {
        message.success(`${result.data.atribuicoesGeradas} atribuições criadas!`);
        setCurrentStep(2);
      } else {
        message.error(result.error || 'Erro ao atribuir eletricistas');
      }
    } catch (error) {
      message.error('Erro ao atribuir eletricistas');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Gerar slots e finalizar
  const handleStep3Finish = async () => {
    if (!periodoId) return;

    setLoading(true);
    try {
      const result = await gerarSlotsEscala({
        escalaEquipePeriodoId: periodoId,
        mode: 'full',
      });

      if (result.success && result.data) {
        message.success(`Escala criada! ${result.data.slotsGerados} slots gerados.`);
        onFinish();
      } else {
        message.error(result.error || 'Erro ao gerar slots');
      }
    } catch (error) {
      message.error('Erro ao gerar slots');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Configurações',
      description: 'Equipe e período',
    },
    {
      title: 'Eletricistas',
      description: 'Atribuir equipe',
    },
    {
      title: 'Gerar Escala',
      description: 'Finalizar',
    },
  ];

  return (
    <div>
      <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />

      {/* Step 1: Configurações */}
      {currentStep === 0 && (
        <Form form={form} layout="vertical">
          <Form.Item
            name="equipeId"
            label="Equipe"
            rules={[{ required: true, message: 'Equipe é obrigatória' }]}
          >
            <Select
              placeholder="Selecione uma equipe"
              loading={equipesLoading}
              showSearch
              optionFilterProp="children"
              options={equipes?.map((equipe: any) => ({
                value: equipe.id,
                label: equipe.nome,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="tipoEscalaId"
            label="Tipo de Escala"
            rules={[{ required: true, message: 'Tipo de escala é obrigatório' }]}
          >
            <Select
              placeholder="Selecione o tipo (4x2, Espanhola, etc)"
              loading={tiposLoading}
              showSearch
              optionFilterProp="children"
              onChange={(value) => {
                const tipo = tiposEscala?.find((t: any) => t.id === value);
                setTipoEscalaSelecionado(tipo);
              }}
              options={tiposEscala?.map((tipo: any) => ({
                value: tipo.id,
                label: `${tipo.nome} - ${tipo.modoRepeticao === 'CICLO_DIAS' ? 'Ciclo' : 'Semanal'}`,
              }))}
            />
          </Form.Item>

          {tipoEscalaSelecionado && (
            <Alert
              message={
                tipoEscalaSelecionado.modoRepeticao === 'CICLO_DIAS'
                  ? `Escala de Ciclo: Requer ${tipoEscalaSelecionado.minEletricistasPorTurno || 3} eletricistas em ciclos defasados`
                  : `Escala Semanal: Requer ${tipoEscalaSelecionado.minEletricistasPorTurno || 2} eletricistas trabalhando juntos`
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item
            name="periodo"
            label="Período da Escala"
            rules={[{ required: true, message: 'Período é obrigatório' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={['Data Início', 'Data Fim']}
            />
          </Form.Item>

          <Form.Item name="observacoes" label="Observações">
            <Input.TextArea rows={3} placeholder="Observações sobre este período" />
          </Form.Item>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>Cancelar</Button>
            <Button type="primary" onClick={handleStep1Next} loading={loading}>
              Próximo
            </Button>
          </Space>
        </Form>
      )}

      {/* Step 2: Eletricistas */}
      {currentStep === 1 && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message={`Selecione ${getQtdEletricistasNecessarios()} eletricista${getQtdEletricistasNecessarios() > 1 ? 's' : ''} para compor a escala`}
            description={
              isCiclo()
                ? 'Cada um trabalhará 4 dias e folgará 2, com ciclos defasados para garantir sempre 2 por turno'
                : 'Os 2 eletricistas trabalharão sempre juntos nos mesmos dias'
            }
            type="info"
            showIcon
          />

          <div>
            <p style={{ marginBottom: 8, fontWeight: 'bold' }}>Eletricistas:</p>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Selecione os eletricistas"
              value={selectedEletricistas}
              onChange={(values) => {
                setSelectedEletricistas(values);
                // Limpar datas de eletricistas removidos
                setProximasFolgas(prev => {
                  const newFolgas: Record<number, Date> = {};
                  values.forEach(id => {
                    if (prev[id]) {
                      newFolgas[id] = prev[id];
                    }
                  });
                  return newFolgas;
                });
              }}
              loading={eletricistasLoading}
              maxCount={getQtdEletricistasNecessarios()}
              options={eletricistas?.map((e: any) => ({
                label: e.nome,
                value: e.id,
              }))}
            />
          </div>

          {/* Datas de próxima folga para escala com ciclo */}
          {isCiclo() && selectedEletricistas.length > 0 && (
            <div>
              <p style={{ marginBottom: 16, fontWeight: 'bold' }}>
                📅 Data da próxima folga de cada eletricista:
              </p>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {selectedEletricistas.map(eletId => {
                  const elet = eletricistas?.find((e: any) => e.id === eletId);
                  return (
                    <Card key={eletId} size="small">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, fontWeight: 500 }}>
                          {elet?.nome}
                        </div>
                        <DatePicker
                          placeholder="Próxima folga"
                          style={{ width: 200 }}
                          format="DD/MM/YYYY"
                          value={proximasFolgas[eletId] ? dayjs(proximasFolgas[eletId]) : null}
                          onChange={(date) => {
                            if (date) {
                              setProximasFolgas(prev => ({
                                ...prev,
                                [eletId]: date.toDate(),
                              }));
                            }
                          }}
                          disabledDate={(current) => {
                            if (!current || !periodoInicio || !periodoFim) return false;
                            const date = current.toDate();
                            return date < periodoInicio || date > periodoFim;
                          }}
                        />
                      </div>
                    </Card>
                  );
                })}
              </Space>
              <Alert
                message="💡 A próxima folga determina o início do ciclo deste eletricista"
                type="info"
                style={{ marginTop: 16 }}
              />
            </div>
          )}

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button onClick={() => setCurrentStep(0)}>Voltar</Button>
            <Button type="primary" onClick={handleStep2Next} loading={loading}>
              Próximo
            </Button>
          </Space>
        </Space>
      )}

      {/* Step 3: Gerar Slots */}
      {currentStep === 2 && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="Tudo pronto! Agora vamos gerar os slots da escala."
            description="Os slots são os dias específicos do período, com as atribuições dos eletricistas já configuradas."
            type="success"
            showIcon
          />

          <Card>
            <h3>Resumo:</h3>
            <p>✅ Período criado</p>
            <p>✅ {selectedEletricistas.length} eletricista(s) atribuído(s)</p>
            <p>⏳ Slots aguardando geração</p>
          </Card>

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button onClick={() => setCurrentStep(1)}>Voltar</Button>
            <Button type="primary" onClick={handleStep3Finish} loading={loading}>
              Gerar Slots e Finalizar
            </Button>
          </Space>
        </Space>
      )}
    </div>
  );
}

