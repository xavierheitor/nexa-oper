/**
 * Wizard de Criação de Período de Escala
 *
 * Fluxo guiado em 2 passos para criar escalas completas
 */

'use client';

import React, { useState } from 'react';
import { Steps, Form, Select, DatePicker, Button, Space, message, Alert, Card, Input } from 'antd';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { listEquipes } from '@/lib/actions/equipe/list';
import { listTiposEscala } from '@/lib/actions/escala/tipoEscala';
import {
  createEscalaEquipePeriodo,
  gerarSlotsEscala,
} from '@/lib/actions/escala/escalaEquipePeriodo';

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

  // Step 2: Gerar slots e finalizar
  const handleStep2Finish = async () => {
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
      description: 'Equipe, tipo e período',
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

      {/* Step 2: Gerar Slots */}
      {currentStep === 1 && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="Tudo pronto! Agora vamos gerar os slots da escala."
            description="Os slots serão criados automaticamente para todos os eletricistas da equipe, seguindo o padrão do tipo de escala selecionado."
            type="success"
            showIcon
          />

          <Card>
            <h3>Resumo:</h3>
            <p>✅ Período criado</p>
            <p>✅ Tipo de escala configurado: {tipoEscalaSelecionado?.nome}</p>
            <p>⏳ Slots aguardando geração</p>
          </Card>

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button onClick={() => setCurrentStep(0)}>Voltar</Button>
            <Button type="primary" onClick={handleStep2Finish} loading={loading}>
              Gerar Slots e Finalizar
            </Button>
          </Space>
        </Space>
      )}
    </div>
  );
}

