/**
 * Wizard de Edição de Período de Escala
 *
 * Permite editar completamente uma escala antes de publicar
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  updateEscalaEquipePeriodo,
  gerarSlotsEscala,
  visualizarEscala,
} from '@/lib/actions/escala/escalaEquipePeriodo';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface EscalaEditWizardProps {
  escalaId: number;
  onFinish: () => void;
  onCancel: () => void;
}

interface EletricistaEscala {
  eletricistaId: number;
  eletricistaNome: string;
  primeiroDiaFolga: number;
}

export default function EscalaEditWizard({ escalaId, onFinish, onCancel }: EscalaEditWizardProps) {
  const { message } = App.useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [tipoEscalaSelecionado, setTipoEscalaSelecionado] = useState<any>(null);
  const [equipeIdSelecionada, setEquipeIdSelecionada] = useState<number | null>(null);
  const [eletricistasEscala, setEletricistasEscala] = useState<EletricistaEscala[]>([]);
  const [buscaEletricista, setBuscaEletricista] = useState('');
  const [dadosOriginais, setDadosOriginais] = useState<any>(null);
  const [valoresFormulario, setValoresFormulario] = useState<any>(null);

  // Carregar dados da escala existente
  useEffect(() => {
    let isMounted = true;

    const carregarDados = async () => {
      if (!isMounted) return;
      setLoadingData(true);
      try {
        const result = await visualizarEscala(escalaId);
        if (!isMounted) return;

        if (result.success && result.data) {
          const dados = result.data;
          setDadosOriginais(dados);

          // Preencher formulário
          const valoresIniciais = {
            equipeId: dados.equipeId,
            tipoEscalaId: dados.tipoEscalaId,
            periodo: [dayjs(dados.periodoInicio), dayjs(dados.periodoFim)],
            observacoes: dados.observacoes,
          };

          form.setFieldsValue(valoresIniciais);
          // Salvar valores iniciais no estado também
          setValoresFormulario(valoresIniciais);

          setEquipeIdSelecionada(dados.equipeId);

          // Encontrar tipo de escala
          const tipos = await listTiposEscala({ page: 1, pageSize: 1000, ativo: true });
          if (!isMounted) return;

          if (tipos.success && tipos.data) {
            const tipo = tipos.data.data?.find((t: any) => t.id === dados.tipoEscalaId);
            if (tipo) {
              setTipoEscalaSelecionado(tipo);
            }
          }

          // Extrair eletricistas dos slots e calcular primeiro dia de folga
          const eletricistasMap = new Map<number, { nome: string; primeiroDiaFolga: number | null }>();

          // Ordenar slots por data e eletricista
          // @ts-ignore - Slots existe no runtime mas não está no tipo TypeScript
          const slotsOrdenados = [...((dados as any).Slots || [])].sort((a: any, b: any) => {
            if (a.eletricistaId !== b.eletricistaId) {
              return a.eletricistaId - b.eletricistaId;
            }
            return new Date(a.data).getTime() - new Date(b.data).getTime();
          });

          const inicio = new Date(dados.periodoInicio);
          inicio.setHours(0, 0, 0, 0);

          slotsOrdenados.forEach(slot => {
            if (!eletricistasMap.has(slot.eletricistaId)) {
              eletricistasMap.set(slot.eletricistaId, {
                nome: slot.eletricista.nome,
                primeiroDiaFolga: null,
              });
            }

            // Encontrar primeiro dia de folga para este eletricista
            const config = eletricistasMap.get(slot.eletricistaId)!;
            if (config.primeiroDiaFolga === null && slot.estado === 'FOLGA') {
              const slotDate = new Date(slot.data);
              slotDate.setHours(0, 0, 0, 0);
              const diffTime = slotDate.getTime() - inicio.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              config.primeiroDiaFolga = diffDays >= 0 ? diffDays : 0;
            }
          });

          // Converter para array de EletricistaEscala
          // Se não encontrou folga, assume 0 (primeiro dia)
          const eletricistasConfig: EletricistaEscala[] = Array.from(eletricistasMap.entries()).map(([id, info]) => ({
            eletricistaId: id,
            eletricistaNome: info.nome,
            primeiroDiaFolga: info.primeiroDiaFolga ?? 0,
          }));

          if (isMounted) {
            setEletricistasEscala(eletricistasConfig);
          }
        }
      } catch (error) {
        if (isMounted) {
          message.error('Erro ao carregar dados da escala');
          console.error(error);
        }
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    };

    carregarDados();

    return () => {
      isMounted = false;
    };
  }, [escalaId, form]);

  // Carregar equipes
  const { data: equipes, isLoading: equipesLoading } = useEntityData({
    key: 'equipes-edit-wizard',
    fetcherAction: unwrapFetcher((params) =>
      listEquipes({
        ...params,
        page: 1,
        pageSize: 1000,
        orderBy: 'nome',
        orderDir: 'asc',
      })
    ) as any,
    paginationEnabled: false,
  });

  // Carregar tipos de escala
  const { data: tiposEscala, isLoading: tiposLoading } = useEntityData({
    key: 'tipos-escala-edit-wizard',
    fetcherAction: unwrapFetcher((params) =>
      listTiposEscala({
        ...params,
        page: 1,
        pageSize: 1000,
        orderBy: 'nome',
        orderDir: 'asc',
        ativo: true,
      })
    ) as any,
    paginationEnabled: false,
  });

  // Carregar eletricistas da equipe selecionada
  const { data: eletricistas, isLoading: eletricistasLoading, mutate: reloadEletricistas } = useEntityData({
    key: `eletricistas-equipe-edit-${equipeIdSelecionada}`,
    fetcherAction: unwrapFetcher((params) => {
      if (!equipeIdSelecionada) return Promise.resolve({ success: true, data: [] });
      return listEletricistas({
        ...params,
        page: 1,
        pageSize: 1000,
        equipeId: equipeIdSelecionada,
      });
    }) as any,
    paginationEnabled: false,
  });

  useEffect(() => {
    if (equipeIdSelecionada) {
      reloadEletricistas();
      setBuscaEletricista('');
    }
  }, [equipeIdSelecionada, reloadEletricistas]);

  // Preservar eletricistas já selecionados quando os eletricistas da equipe são carregados
  // Remove apenas os que não estão mais na equipe atual
  useEffect(() => {
    if (eletricistas && eletricistas.length > 0 && eletricistasEscala.length > 0) {
      const eletricistasIds = new Set(eletricistas.map((e: any) => e.id));
      // Remove eletricistas que não estão mais na equipe atual
      const eletricistasValidos = eletricistasEscala.filter(e => eletricistasIds.has(e.eletricistaId));

      // Se algum foi removido, atualiza o estado
      if (eletricistasValidos.length !== eletricistasEscala.length) {
        setEletricistasEscala(eletricistasValidos);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eletricistas]);

  // Step 1: Editar configurações
  const handleStep1Next = async () => {
    try {
      const values = await form.validateFields(['equipeId', 'tipoEscalaId', 'periodo', 'observacoes']);
      // Salvar valores do formulário no estado para usar no Step 3
      setValoresFormulario(values);
      setCurrentStep(1);
    } catch (error) {
      console.error('Erro na validação:', error);
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

  // Step 3: Salvar e regenerar slots
  const handleStep3Finish = async () => {
    setLoading(true);
    try {
      // Usar valores salvos do Step 1 ou obter do formulário como fallback
      const values = valoresFormulario || form.getFieldsValue();

      // Validar campos obrigatórios
      if (!values.equipeId) {
        message.error('Equipe é obrigatória. Por favor, volte ao passo 1.');
        setLoading(false);
        return;
      }

      if (!values.tipoEscalaId) {
        message.error('Tipo de escala é obrigatório. Por favor, volte ao passo 1.');
        setLoading(false);
        return;
      }

      // Validar que período existe e é válido
      if (!values.periodo || !Array.isArray(values.periodo) || values.periodo.length !== 2) {
        message.error('Período inválido. Por favor, volte ao passo 1 e selecione um período válido.');
        setLoading(false);
        return;
      }

      // Atualizar período
      const updateResult = await updateEscalaEquipePeriodo({
        id: escalaId,
        equipeId: values.equipeId,
        tipoEscalaId: values.tipoEscalaId,
        periodoInicio: values.periodo[0].toDate(),
        periodoFim: values.periodo[1].toDate(),
        observacoes: values.observacoes,
      });

      if (!updateResult.success) {
        message.error(updateResult.error || 'Erro ao atualizar escala');
        return;
      }

      // Verificar se houve mudanças que requerem regeneração de slots
      const mudouEquipe = dadosOriginais.equipeId !== values.equipeId;
      const mudouTipo = dadosOriginais.tipoEscalaId !== values.tipoEscalaId;

      const periodoInicioOriginal = new Date(dadosOriginais.periodoInicio);
      periodoInicioOriginal.setHours(0, 0, 0, 0);
      const periodoFimOriginal = new Date(dadosOriginais.periodoFim);
      periodoFimOriginal.setHours(0, 0, 0, 0);

      const periodoInicioNovo = values.periodo[0].toDate();
      periodoInicioNovo.setHours(0, 0, 0, 0);
      const periodoFimNovo = values.periodo[1].toDate();
      periodoFimNovo.setHours(0, 0, 0, 0);

      const mudouPeriodo =
        periodoInicioOriginal.getTime() !== periodoInicioNovo.getTime() ||
        periodoFimOriginal.getTime() !== periodoFimNovo.getTime();

      // Verificar mudanças nos eletricistas
      // @ts-ignore - Slots existe no runtime mas não está no tipo TypeScript
      const slotsOriginais = (dadosOriginais as any).Slots || [];
      const eletricistasOriginaisIds = (slotsOriginais as any[]).map((s: any) => Number(s.eletricistaId)).filter((id): id is number => typeof id === 'number');
      const eletricistasOriginais = new Set<number>(eletricistasOriginaisIds);
      const eletricistasNovos = new Set<number>(eletricistasEscala.map(e => e.eletricistaId));
      const mudouEletricistas =
        eletricistasOriginais.size !== eletricistasNovos.size ||
        Array.from(eletricistasOriginais as Set<number>).some((id: number) => !eletricistasNovos.has(id)) ||
        Array.from(eletricistasNovos as Set<number>).some((id: number) => !eletricistasOriginais.has(id));

      // Se houve mudanças, regenerar slots
      if (mudouEquipe || mudouTipo || mudouPeriodo || mudouEletricistas) {
        const slotsResult = await gerarSlotsEscala({
          escalaEquipePeriodoId: escalaId,
          mode: 'full',
          eletricistasConfig: eletricistasEscala,
        });

        if (slotsResult.success && slotsResult.data) {
          message.success(`Escala atualizada! ${slotsResult.data.slotsGerados} slots regenerados.`);
        } else {
          message.warning('Escala atualizada, mas houve erro ao regenerar slots: ' + (slotsResult.error || 'Erro desconhecido'));
        }
      } else {
        message.success('Escala atualizada! Nenhuma mudança que requeira regeneração de slots.');
      }

      onFinish();
    } catch (error) {
      message.error('Erro ao salvar alterações');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers para gerenciar eletricistas (memoizados para evitar re-renderizações)
  const toggleEletricista = useCallback((eletricista: any, checked: boolean) => {
    setEletricistasEscala((prev) => {
      if (checked) {
        return [
          ...prev,
          {
            eletricistaId: eletricista.id,
            eletricistaNome: eletricista.nome,
            primeiroDiaFolga: 0,
          },
        ];
      } else {
        return prev.filter((e) => e.eletricistaId !== eletricista.id);
      }
    });
  }, []);

  const updatePrimeiroDiaFolga = useCallback((eletricistaId: number, dia: number) => {
    setEletricistasEscala((prev) =>
      prev.map((e) =>
        e.eletricistaId === eletricistaId ? { ...e, primeiroDiaFolga: dia } : e
      )
    );
  }, []);

  // Filtra eletricistas mantendo os selecionados sempre visíveis e ordena (selecionados primeiro)
  const eletricistasFilteredForDisplay = React.useMemo(() => {
    if (!eletricistas) return [];

    const busca = buscaEletricista.toLowerCase().trim();
    const eletricistasSelecionadosIds = new Set(eletricistasEscala.map(e => e.eletricistaId));

    // Filtrar eletricistas
    let filtrados = eletricistas;
    if (busca) {
      filtrados = eletricistas.filter((eletricista: any) => {
        const estaSelecionado = eletricistasSelecionadosIds.has(eletricista.id);

        if (estaSelecionado) {
          return true; // Sempre mostra selecionados
        }

        const nomeMatch = eletricista.nome?.toLowerCase().includes(busca);
        const matriculaMatch = eletricista.matricula?.toLowerCase().includes(busca);

        return nomeMatch || matriculaMatch;
      });
    }

    // Ordenar: selecionados primeiro, depois os demais (ambos ordenados por nome)
    return [...filtrados].sort((a: any, b: any) => {
      const aSelecionado = eletricistasSelecionadosIds.has(a.id);
      const bSelecionado = eletricistasSelecionadosIds.has(b.id);

      // Se um é selecionado e o outro não, o selecionado vem primeiro
      if (aSelecionado && !bSelecionado) return -1;
      if (!aSelecionado && bSelecionado) return 1;

      // Se ambos são selecionados ou ambos não são, ordena por nome
      return (a.nome || '').localeCompare(b.nome || '');
    });
  }, [eletricistas, buscaEletricista, eletricistasEscala]);

  // Memoizar colunas da tabela para evitar re-renderizações desnecessárias
  const tableColumns = useMemo(() => [
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
    // ✅ CORREÇÃO: Mostrar coluna "1º Dia de Folga" apenas para escalas CICLO_DIAS
    // Para SEMANA_DEPENDENTE (espanhola), a folga é determinada pela semana e dia da semana
    ...(tipoEscalaSelecionado?.modoRepeticao === 'CICLO_DIAS'
      ? [
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
                  key={`primeiro-dia-folga-${record.id}`}
                  min={0}
                  placeholder="Ex: 2"
                  value={eletricistaConfig.primeiroDiaFolga}
                  onChange={(value) => updatePrimeiroDiaFolga(record.id, value || 0)}
                  style={{ width: '100%' }}
                  addonAfter="dias"
                  controls={true}
                />
              );
            },
          },
        ]
      : []),
  ], [eletricistasEscala, toggleEletricista, updatePrimeiroDiaFolga, tipoEscalaSelecionado]);

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
      title: 'Salvar Alterações',
      description: 'Finalizar',
    },
  ];

  if (loadingData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Form form={form} style={{ display: 'none' }}>
          {/* Form oculto para evitar warning durante carregamento */}
        </Form>
        <Alert message="Carregando dados da escala..." type="info" />
      </div>
    );
  }

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
          <Alert
            message="Editar Escala"
            description="Você pode alterar equipe, tipo de escala, período e observações. Se houver mudanças significativas, os slots serão regenerados automaticamente."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

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
              onChange={(value) => {
                // Se mudou a equipe, limpa os eletricistas selecionados (exceto se for a equipe original)
                if (value !== dadosOriginais?.equipeId) {
                  setEletricistasEscala([]);
                }
                setEquipeIdSelecionada(value);
              }}
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
                label: tipo.nome,
              }))}
            />
          </Form.Item>

          {tipoEscalaSelecionado && (
            <Alert
              message={`Tipo de escala selecionado: ${tipoEscalaSelecionado.nome}`}
              description={`Requer ${tipoEscalaSelecionado.eletricistasPorTurma || 'N/A'} eletricista(s) por turma.`}
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
            <Button type="primary" onClick={handleStep1Next}>
              Próximo
            </Button>
          </Space>
        </Form>
      )}

      {/* Step 2: Selecionar Eletricistas */}
      {currentStep === 1 && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {tipoEscalaSelecionado?.modoRepeticao === 'SEMANA_DEPENDENTE' ? (
            <Alert
              message="Escala Semana Dependente (Espanhola)"
              description="Para este tipo de escala, a folga é determinada automaticamente pela semana e dia da semana (sábado/domingo). Não é necessário definir o primeiro dia de folga."
              type="info"
              showIcon
            />
          ) : (
            <Alert
              message="Selecione os eletricistas e defina o primeiro dia de folga de cada um"
              description="Informe em qual dia (contando desde o início do período) o eletricista terá sua primeira folga."
              type="info"
              showIcon
            />
          )}

          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
            <Button onClick={() => setCurrentStep(0)}>Voltar</Button>
            <Button type="primary" onClick={handleStep2Next}>
              Próximo
            </Button>
          </Space>

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
            <Input
              placeholder="Buscar por nome ou matrícula..."
              value={buscaEletricista}
              onChange={(e) => setBuscaEletricista(e.target.value)}
              style={{ marginBottom: 16 }}
              allowClear
              prefix={<span>🔍</span>}
            />

            <Table
              dataSource={eletricistasFilteredForDisplay}
              rowKey="id"
              pagination={false}
              size="small"
              rowClassName={(record: any) => {
                const estaSelecionado = eletricistasEscala.some(e => e.eletricistaId === record.id);
                return estaSelecionado ? 'row-selecionado' : '';
              }}
              columns={tableColumns}
            />

            {eletricistasEscala.length > 0 && (
              <Alert
                style={{ marginTop: 16 }}
                message={`${eletricistasEscala.length} de ${eletricistas?.length || 0} eletricista(s) selecionado(s) para escalar`}
                type="success"
                showIcon
              />
            )}
          </Card>
        </Space>
      )}

      {/* Step 3: Salvar */}
      {currentStep === 2 && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="Salvar alterações"
            description="As alterações serão salvas e os slots serão regenerados automaticamente se necessário."
            type="success"
            showIcon
          />

          <Card>
            <h3>Resumo das alterações:</h3>
            <p>✅ Configurações atualizadas</p>
            <p>✅ {eletricistasEscala.length} eletricista(s) configurado(s)</p>
            <p>⏳ Slots serão regenerados se houver mudanças</p>
          </Card>

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button onClick={() => setCurrentStep(1)}>Voltar</Button>
            <Button type="primary" onClick={handleStep3Finish} loading={loading}>
              Salvar e Regenerar Slots
            </Button>
          </Space>
        </Space>
      )}
    </div>
  );
}
