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

  // Filtro de busca de eletricistas
  const [buscaEletricista, setBuscaEletricista] = useState('');

  // Carregar equipes (TODAS, sem paginação) - usa unwrapFetcher
  const { data: equipes, isLoading: equipesLoading } = useEntityData({
    key: 'equipes-wizard',
    fetcherAction: unwrapFetcher((params) =>
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
    fetcherAction: unwrapFetcher((params) =>
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
    fetcherAction: unwrapFetcher((params) => {
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
      setBuscaEletricista(''); // Limpa o filtro ao trocar de equipe
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

    // ✅ CORREÇÃO: Para escalas SEMANA_DEPENDENTE (espanhola), não precisa validar primeiroDiaFolga
    // A folga é determinada pela semana e dia da semana (sábado/domingo)
    const isSemanaDependente = tipoEscalaSelecionado?.modoRepeticao === 'SEMANA_DEPENDENTE';

    if (!isSemanaDependente) {
      // Validar se todos têm dia da primeira folga definido (apenas para CICLO_DIAS)
      const semPosicao = eletricistasEscala.filter(e => e.primeiroDiaFolga === undefined || e.primeiroDiaFolga === null);
      if (semPosicao.length > 0) {
        message.warning('Defina o primeiro dia de folga para todos os eletricistas');
        return;
      }
    }

    setCurrentStep(2);
  };

  // Step 3: Gerar slots e finalizar
  const handleStep3Finish = async () => {
    if (!periodoId) return;

    setLoading(true);
    try {
      // ✅ CORREÇÃO: Garantir que primeiroDiaFolga tenha valor padrão para escalas SEMANA_DEPENDENTE
      const eletricistasConfigCompleto = eletricistasEscala.map(e => ({
        ...e,
        primeiroDiaFolga: e.primeiroDiaFolga ?? 0, // Valor padrão se não definido
      }));

      const result = await gerarSlotsEscala({
        escalaEquipePeriodoId: periodoId,
        mode: 'full',
        eletricistasConfig: eletricistasConfigCompleto,
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
      // ✅ CORREÇÃO: Para escalas SEMANA_DEPENDENTE, primeiroDiaFolga não é necessário
      // mas definimos como 0 para compatibilidade com o serviço
      const isSemanaDependente = tipoEscalaSelecionado?.modoRepeticao === 'SEMANA_DEPENDENTE';
      setEletricistasEscala([
        ...eletricistasEscala,
        {
          eletricistaId: eletricista.id,
          eletricistaNome: eletricista.nome,
          primeiroDiaFolga: isSemanaDependente ? 0 : 0, // Sempre 0, mas não usado para SEMANA_DEPENDENTE
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

  // Filtra eletricistas mantendo os selecionados sempre visíveis
  const eletricistasFilteredForDisplay = React.useMemo(() => {
    if (!eletricistas) return [];

    const busca = buscaEletricista.toLowerCase().trim();

    if (!busca) {
      return eletricistas; // Sem filtro, mostra todos
    }

    // Filtra por nome ou matrícula, mas sempre inclui os já selecionados
    return eletricistas.filter((eletricista: any) => {
      const estaSelecionado = eletricistasEscala.some(e => e.eletricistaId === eletricista.id);

      if (estaSelecionado) {
        return true; // Sempre mostra selecionados
      }

      // Para não selecionados, aplica o filtro
      const nomeMatch = eletricista.nome?.toLowerCase().includes(busca);
      const matriculaMatch = eletricista.matricula?.toLowerCase().includes(busca);

      return nomeMatch || matriculaMatch;
    });
  }, [eletricistas, buscaEletricista, eletricistasEscala]);

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
      <style>{`
        .row-selecionado {
          background-color: #e6f4ff !important;
        }
        .row-selecionado:hover td {
          background-color: #bae0ff !important;
        }
      `}</style>

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

          <Form.Item
            name="observacoes"
            label="Observações"
            rules={[
              { max: 1000, message: 'Observações deve ter no máximo 1000 caracteres' }
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Observações sobre este período"
              maxLength={1000}
              showCount
            />
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

          <Card
            title={
              <Space>
                <span>Eletricistas da Equipe</span>
                {buscaEletricista && (
                  <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>
                    ({eletricistasFilteredForDisplay.length} de {eletricistas?.length || 0} exibidos)
                  </span>
                )}
              </Space>
            }
            loading={eletricistasLoading}
          >
            {/* Campo de busca */}
            <Input
              placeholder="Buscar por nome ou matrícula..."
              value={buscaEletricista}
              onChange={(e) => setBuscaEletricista(e.target.value)}
              style={{ marginBottom: 16 }}
              allowClear
              prefix={<span>🔍</span>}
            />

            {tipoEscalaSelecionado?.modoRepeticao === 'SEMANA_DEPENDENTE' && (
              <Alert
                message="Escala Semana Dependente (Espanhola)"
                description="Para este tipo de escala, a folga é determinada automaticamente pela semana e dia da semana (sábado/domingo). Não é necessário definir o primeiro dia de folga."
                type="info"
                showIcon
                closable
                style={{ marginBottom: 16 }}
              />
            )}

            {buscaEletricista && (
              <Alert
                message={`Mostrando ${eletricistasFilteredForDisplay.length} eletricista(s). Selecionados permanecem visíveis mesmo fora do filtro.`}
                type="info"
                showIcon
                closable
                style={{ marginBottom: 16 }}
              />
            )}

            <Table
              dataSource={eletricistasFilteredForDisplay}
              rowKey="id"
              pagination={false}
              size="small"
              rowClassName={(record: any) => {
                const estaSelecionado = eletricistasEscala.some(e => e.eletricistaId === record.id);
                return estaSelecionado ? 'row-selecionado' : '';
              }}
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
                // ✅ Mostrar coluna "1º Dia de Folga" para escalas CICLO_DIAS
                // Para SEMANA_DEPENDENTE (espanhola), a folga é determinada pela semana e dia da semana
                {
                  title: '1º Dia de Folga',
                  key: 'primeiroDiaFolga',
                  width: 150,
                  render: (_: unknown, record: any) => {
                    const eletricistaConfig = eletricistasEscala.find(
                      (e) => e.eletricistaId === record.id
                    );

                    // Se não está selecionado, não mostra nada
                    if (!eletricistaConfig) return null;

                    // Se é escala SEMANA_DEPENDENTE, mostra como desabilitado com tooltip
                    const isSemanaDependente = tipoEscalaSelecionado?.modoRepeticao === 'SEMANA_DEPENDENTE';

                    if (isSemanaDependente) {
                      return (
                        <InputNumber
                          min={0}
                          placeholder="N/A"
                          value={0}
                          disabled
                          style={{ width: '100%' }}
                          addonAfter="dias"
                          title="Para escalas semana dependente, a folga é determinada automaticamente pela semana e dia da semana"
                        />
                      );
                    }

                    // Para CICLO_DIAS, permite edição
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
                message={`${eletricistasEscala.length} de ${eletricistas?.length || 0} eletricista(s) selecionado(s) para escalar`}
                type="success"
                showIcon
              />
            )}

            {eletricistas && eletricistas.length === 0 && (
              <Alert
                message="Nenhum eletricista encontrado nesta equipe"
                description="Certifique-se de que a equipe selecionada possui eletricistas cadastrados e ativos."
                type="warning"
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

