/**
 * Wizard de Criação de Período de Escala
 *
 * Fluxo guiado em 3 passos para criar escalas completas
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Steps,
  Form,
  Select,
  DatePicker,
  Button,
  Space,
  Alert,
  Card,
  Input,
  Table,
  InputNumber,
  Checkbox,
  App,
} from 'antd';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { listEquipes } from '@/lib/actions/equipe/list';
import { listTiposEscala } from '@/lib/actions/escala/tipoEscala';
import { listEletricistas } from '@/lib/actions/eletricista/list';
import {
  createEscalaEquipePeriodo,
  gerarSlotsEscala,
} from '@/lib/actions/escala/escalaEquipePeriodo';

const { RangePicker } = DatePicker;

interface EscalaWizardProps {
  onFinish: () => void;
  onCancel: () => void;
}

interface EletricistaEscala {
  eletricistaId: number;
  eletricistaNome: string;
  primeiroDiaFolga: number; // Dia da primeira folga desde o início do período (0 = primeiro dia)
}

export default function EscalaWizard({ onFinish, onCancel }: EscalaWizardProps) {
  const { message } = App.useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Dados do período criado
  const [periodoId, setPeriodoId] = useState<number | null>(null);
  const [tipoEscalaSelecionado, setTipoEscalaSelecionado] = useState<any>(null);
  const [equipeIdSelecionada, setEquipeIdSelecionada] = useState<number | null>(null);

  // Eletricistas selecionados com posição inicial
  const [eletricistasEscala, setEletricistasEscala] = useState<EletricistaEscala[]>([]);

  // Carregar equipes (TODAS, sem paginação) - usa unwrapFetcher
  const { data: equipes, isLoading: equipesLoading } = useEntityData({
    key: 'equipes-wizard',
    fetcher: unwrapFetcher((params) =>
      listEquipes({
        ...params,
        page: 1,
        pageSize: 1000, // Todas as equipes ativas
        orderBy: 'nome',
        orderDir: 'asc',
      })
    ) as any,
    paginationEnabled: false,
  });

  // Carregar tipos de escala (TODOS) - usa unwrapFetcher
  const { data: tiposEscala, isLoading: tiposLoading } = useEntityData({
    key: 'tipos-escala-wizard',
    fetcher: unwrapFetcher((params) =>
      listTiposEscala({
        ...params,
        page: 1,
        pageSize: 1000, // Todos os tipos ativos
        orderBy: 'nome',
        orderDir: 'asc',
        ativo: true,
      })
    ) as any,
    paginationEnabled: false,
  });

  // Carregar eletricistas da equipe selecionada (TODOS) - usa unwrapFetcher
  const { data: eletricistas, isLoading: eletricistasLoading, mutate: reloadEletricistas } = useEntityData({
    key: `eletricistas-equipe-${equipeIdSelecionada}`,
    fetcher: unwrapFetcher((params) => {
      if (!equipeIdSelecionada) return Promise.resolve({ success: true, data: [] });
      return listEletricistas({
        ...params,
        page: 1,
        pageSize: 1000, // Todos os eletricistas da equipe
        equipeId: equipeIdSelecionada,
      });
    }) as any,
    paginationEnabled: false,
  });

  // Recarregar eletricistas quando a equipe mudar
  useEffect(() => {
    if (equipeIdSelecionada) {
      reloadEletricistas();
    }
  }, [equipeIdSelecionada, reloadEletricistas]);

  // Debug: Log das equipes carregadas
  useEffect(() => {
    if (equipes) {
      console.log('✅ Equipes disponíveis no Select:', {
        total: equipes.length,
        nomes: equipes.map((e: any) => e.nome),
      });
    }
  }, [equipes]);

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

  // Step 2: Configurar eletricistas
  const handleStep2Next = () => {
    if (eletricistasEscala.length === 0) {
      message.warning('Selecione pelo menos um eletricista para a escala');
      return;
    }

    // Validar se todos têm dia da primeira folga definido
    const semPosicao = eletricistasEscala.filter(e => e.primeiroDiaFolga === undefined || e.primeiroDiaFolga === null);
    if (semPosicao.length > 0) {
      message.warning('Defina o primeiro dia de folga para todos os eletricistas');
      return;
    }

    setCurrentStep(2);
  };

  // Step 3: Gerar slots e finalizar
  const handleStep3Finish = async () => {
    if (!periodoId) return;

    setLoading(true);
    try {
      const result = await gerarSlotsEscala({
        escalaEquipePeriodoId: periodoId,
        mode: 'full',
        eletricistasConfig: eletricistasEscala,
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

  // Handlers para gerenciar eletricistas
  const toggleEletricista = (eletricista: any, checked: boolean) => {
    if (checked) {
      setEletricistasEscala([
        ...eletricistasEscala,
        {
          eletricistaId: eletricista.id,
          eletricistaNome: eletricista.nome,
          primeiroDiaFolga: 0,
        },
      ]);
    } else {
      setEletricistasEscala(
        eletricistasEscala.filter((e) => e.eletricistaId !== eletricista.id)
      );
    }
  };

  const updatePrimeiroDiaFolga = (eletricistaId: number, dia: number) => {
    setEletricistasEscala(
      eletricistasEscala.map((e) =>
        e.eletricistaId === eletricistaId ? { ...e, primeiroDiaFolga: dia } : e
      )
    );
  };

  const steps = [
    {
      title: 'Configurações',
      description: 'Equipe, tipo e período',
    },
    {
      title: 'Eletricistas',
      description: 'Selecionar e posicionar',
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
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              onChange={(value) => setEquipeIdSelecionada(value)}
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
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              onChange={(value) => {
                const tipo = tiposEscala?.find((t: any) => t.id === value);
                setTipoEscalaSelecionado(tipo);
              }}
              options={tiposEscala?.map((tipo: any) => ({
                value: tipo.id,
                label: tipo.nome, // Apenas o nome, sem prefixo adicional
              }))}
            />
          </Form.Item>

          {tipoEscalaSelecionado && (
            <Alert
              message={`Tipo de escala selecionado: ${tipoEscalaSelecionado.nome}`}
              description={`Requer ${tipoEscalaSelecionado.eletricistasPorTurma || 'N/A'} eletricista(s) por turma. Os slots serão gerados automaticamente para todos os eletricistas da equipe.`}
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

      {/* Step 2: Selecionar Eletricistas */}
      {currentStep === 1 && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="Selecione os eletricistas e defina o primeiro dia de folga de cada um"
            description="Informe em qual dia (contando desde o início do período) o eletricista terá sua primeira folga. Exemplo: 0 = folga já no primeiro dia, 2 = folga no terceiro dia, etc."
            type="info"
            showIcon
          />

          <Card title="Eletricistas da Equipe" loading={eletricistasLoading}>
            <Table
              dataSource={eletricistas || []}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Participar',
                  key: 'participar',
                  width: 80,
                  render: (_: unknown, record: any) => (
                    <Checkbox
                      checked={eletricistasEscala.some((e) => e.eletricistaId === record.id)}
                      onChange={(e) => toggleEletricista(record, e.target.checked)}
                    />
                  ),
                },
                {
                  title: 'Nome',
                  dataIndex: 'nome',
                  key: 'nome',
                },
                {
                  title: 'Matrícula',
                  dataIndex: 'matricula',
                  key: 'matricula',
                  width: 120,
                },
                {
                  title: '1º Dia de Folga',
                  key: 'primeiroDiaFolga',
                  width: 150,
                  render: (_: unknown, record: any) => {
                    const eletricistaConfig = eletricistasEscala.find(
                      (e) => e.eletricistaId === record.id
                    );
                    if (!eletricistaConfig) return null;

                    return (
                      <InputNumber
                        min={0}
                        placeholder="Ex: 2"
                        value={eletricistaConfig.primeiroDiaFolga}
                        onChange={(value) => updatePrimeiroDiaFolga(record.id, value || 0)}
                        style={{ width: '100%' }}
                        addonAfter="dias"
                      />
                    );
                  },
                },
              ]}
            />

            {eletricistasEscala.length > 0 && (
              <Alert
                style={{ marginTop: 16 }}
                message={`${eletricistasEscala.length} eletricista(s) selecionado(s)`}
                type="success"
                showIcon
              />
            )}
          </Card>

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button onClick={() => setCurrentStep(0)}>Voltar</Button>
            <Button type="primary" onClick={handleStep2Next}>
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
            description="Os slots serão criados automaticamente para os eletricistas selecionados, seguindo o padrão do tipo de escala e as posições iniciais definidas."
            type="success"
            showIcon
          />

          <Card>
            <h3>Resumo:</h3>
            <p>✅ Período criado</p>
            <p>✅ Tipo de escala configurado: {tipoEscalaSelecionado?.nome}</p>
            <p>✅ {eletricistasEscala.length} eletricista(s) configurado(s)</p>
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

