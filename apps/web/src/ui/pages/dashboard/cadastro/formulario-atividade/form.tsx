'use client';

import { App, Button, Card, Form, Input, Select, Spin, Switch, Transfer } from 'antd';
import type { TransferItem } from 'antd/es/transfer';
import { useEffect, useMemo, useState } from 'react';

export interface AtividadeFormularioFormData {
  nome: string;
  descricao?: string;
  contratoId: number;
  ativo?: boolean;
  tipoServicoIds: number[];
  perguntaIds: number[];
}

interface ContratoOption {
  id: number;
  nome: string;
  numero?: string;
}

interface TipoServicoOption {
  id: number;
  nome: string;
  atividadeTipo?: {
    id: number;
    nome: string;
    contratoId: number;
  } | null;
}

interface PerguntaCatalogoOption {
  id: number;
  perguntaChave: string;
  titulo: string;
  obrigaFoto: boolean;
  atividadeFormTemplate?: {
    contratoId: number;
  } | null;
}

interface InitialVinculo {
  atividadeTipoServicoId: number;
}

interface Props {
  onSubmit: (values: AtividadeFormularioFormData) => void;
  initialValues?:
    | (Partial<AtividadeFormularioFormData> & {
        atividadeFormTipoServicoRelacoes?: InitialVinculo[];
      })
    | undefined;
  loading?: boolean;
  contratos: ContratoOption[];
  tiposServico: TipoServicoOption[];
  perguntasCatalogo: PerguntaCatalogoOption[];
}

export default function AtividadeFormularioForm({
  onSubmit,
  initialValues,
  loading = false,
  contratos,
  tiposServico,
  perguntasCatalogo,
}: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<AtividadeFormularioFormData>();
  const [targetTipoServicos, setTargetTipoServicos] = useState<string[]>([]);
  const [targetPerguntas, setTargetPerguntas] = useState<string[]>([]);
  const contratoSelecionadoId = Form.useWatch('contratoId', form);

  const tiposServicoFiltrados = useMemo(() => {
    if (typeof contratoSelecionadoId !== 'number') {
      return tiposServico;
    }

    return tiposServico.filter(
      (item) => item.atividadeTipo?.contratoId === contratoSelecionadoId
    );
  }, [contratoSelecionadoId, tiposServico]);

  const perguntasFiltradas = useMemo(() => {
    if (typeof contratoSelecionadoId !== 'number') {
      return perguntasCatalogo;
    }

    return perguntasCatalogo.filter(
      (item) => item.atividadeFormTemplate?.contratoId === contratoSelecionadoId
    );
  }, [contratoSelecionadoId, perguntasCatalogo]);

  const tipoServicoItems = useMemo<TransferItem[]>(
    () =>
      tiposServicoFiltrados.map((item) => ({
        key: String(item.id),
        title: item.atividadeTipo
          ? `${item.nome} (${item.atividadeTipo.nome})`
          : item.nome,
      })),
    [tiposServicoFiltrados]
  );

  const perguntaItems = useMemo<TransferItem[]>(
    () =>
      perguntasFiltradas.map((item) => ({
        key: String(item.id),
        title: `${item.titulo} [${item.perguntaChave}]${item.obrigaFoto ? ' (foto obrigatória)' : ''}`,
      })),
    [perguntasFiltradas]
  );

  useEffect(() => {
    if (initialValues) {
      const vinculados = (
        initialValues.atividadeFormTipoServicoRelacoes || []
      ).map((item) => String(item.atividadeTipoServicoId));

      form.setFieldsValue({
        nome: initialValues.nome,
        descricao: initialValues.descricao,
        contratoId: initialValues.contratoId,
        ativo: initialValues.ativo ?? true,
      });
      setTargetTipoServicos(vinculados);
      setTargetPerguntas((initialValues.perguntaIds || []).map(String));
      return;
    }

    form.resetFields();
    form.setFieldsValue({ ativo: true });
    setTargetTipoServicos([]);
    setTargetPerguntas([]);
  }, [initialValues, form]);

  useEffect(() => {
    const idsDisponiveis = new Set(tiposServicoFiltrados.map((item) => item.id));
    setTargetTipoServicos((prev) =>
      prev.filter((itemId) => idsDisponiveis.has(Number(itemId)))
    );
  }, [tiposServicoFiltrados]);

  useEffect(() => {
    const idsDisponiveis = new Set(perguntasFiltradas.map((item) => item.id));
    setTargetPerguntas((prev) =>
      prev.filter((itemId) => idsDisponiveis.has(Number(itemId)))
    );
  }, [perguntasFiltradas]);

  const handleSubmit = (values: AtividadeFormularioFormData) => {
    if (!values.contratoId) {
      message.error('Selecione o contrato do formulário.');
      return;
    }

    onSubmit({
      ...values,
      descricao: values.descricao?.trim() || undefined,
      ativo: values.ativo ?? true,
      tipoServicoIds: targetTipoServicos.map(Number),
      perguntaIds: targetPerguntas.map(Number),
    });
  };

  return (
    <Spin spinning={loading}>
      <Form form={form} layout='vertical' onFinish={handleSubmit}>
        <Form.Item
          name='nome'
          label='Nome do Formulário'
          rules={[
            { required: true, message: 'Nome é obrigatório' },
            { min: 1, max: 255, message: 'Nome deve ter entre 1 e 255 caracteres' },
          ]}
        >
          <Input autoFocus placeholder='Digite o nome do formulário' maxLength={255} />
        </Form.Item>

        <Form.Item
          name='descricao'
          label='Descrição'
          rules={[{ max: 500, message: 'Descrição deve ter no máximo 500 caracteres' }]}
        >
          <Input.TextArea rows={3} maxLength={500} placeholder='Descrição (opcional)' />
        </Form.Item>

        <Form.Item
          name='contratoId'
          label='Contrato'
          rules={[{ required: true, message: 'Contrato é obrigatório' }]}
        >
          <Select
            placeholder='Selecione o contrato'
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            options={contratos.map((contrato) => ({
              value: contrato.id,
              label: contrato.numero
                ? `${contrato.nome} (${contrato.numero})`
                : contrato.nome,
            }))}
          />
        </Form.Item>

        <Card size='small' title='Vínculo com Perguntas (Catálogo)'>
          <Transfer
            dataSource={perguntaItems}
            targetKeys={targetPerguntas}
            onChange={(nextTargetKeys) => setTargetPerguntas(nextTargetKeys.map(String))}
            render={(item) => item.title as string}
            listStyle={{ width: '48%', height: 260 }}
            titles={['Disponíveis', 'Vinculadas']}
          />
        </Card>

        <Card size='small' title='Vínculo com Tipos de Serviço' style={{ marginTop: 16 }}>
          <Transfer
            dataSource={tipoServicoItems}
            targetKeys={targetTipoServicos}
            onChange={(nextTargetKeys) => setTargetTipoServicos(nextTargetKeys.map(String))}
            render={(item) => item.title as string}
            listStyle={{ width: '48%', height: 260 }}
            titles={['Disponíveis', 'Vinculados']}
          />
        </Card>

        <Form.Item name='ativo' label='Ativo' valuePropName='checked' style={{ marginTop: 16 }}>
          <Switch />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block loading={loading}>
            Salvar
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
}
