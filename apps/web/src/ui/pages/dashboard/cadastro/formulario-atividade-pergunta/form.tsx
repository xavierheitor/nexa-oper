'use client';

import { App, Button, Form, Input, InputNumber, Select, Spin, Switch } from 'antd';
import { useEffect } from 'react';

export interface AtividadeFormularioPerguntaFormData {
  contratoId: number;
  perguntaChave: string;
  ordem?: number;
  titulo: string;
  hintResposta?: string;
  tipoResposta?: string;
  obrigaFoto?: boolean;
  ativo?: boolean;
}

interface ContratoOption {
  id: number;
  nome: string;
  numero?: string;
}

interface Props {
  onSubmit: (values: AtividadeFormularioPerguntaFormData) => void;
  initialValues?: Partial<AtividadeFormularioPerguntaFormData>;
  loading?: boolean;
  contratos: ContratoOption[];
}

export default function AtividadeFormularioPerguntaForm({
  onSubmit,
  initialValues,
  loading = false,
  contratos,
}: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<AtividadeFormularioPerguntaFormData>();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      return;
    }

    form.resetFields();
    form.setFieldsValue({
      ordem: 0,
      tipoResposta: 'texto',
      obrigaFoto: false,
      ativo: true,
    });
  }, [initialValues, form]);

  const handleSubmit = (values: AtividadeFormularioPerguntaFormData) => {
    if (!values.contratoId) {
      message.error('Selecione o contrato da pergunta.');
      return;
    }

    onSubmit({
      ...values,
      ordem: values.ordem ?? 0,
      tipoResposta: values.tipoResposta?.trim() || 'texto',
      hintResposta: values.hintResposta?.trim() || undefined,
      obrigaFoto: values.obrigaFoto ?? false,
      ativo: values.ativo ?? true,
    });
  };

  return (
    <Spin spinning={loading}>
      <Form form={form} layout='vertical' onFinish={handleSubmit}>
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

        <Form.Item
          name='titulo'
          label='Pergunta'
          rules={[
            { required: true, message: 'Pergunta é obrigatória' },
            { min: 1, max: 255, message: 'Pergunta deve ter entre 1 e 255 caracteres' },
          ]}
        >
          <Input placeholder='Digite o texto da pergunta' maxLength={255} />
        </Form.Item>

        <Form.Item
          name='perguntaChave'
          label='Chave da Pergunta'
          rules={[
            { required: true, message: 'Chave é obrigatória' },
            { min: 1, max: 120, message: 'Chave deve ter entre 1 e 120 caracteres' },
          ]}
        >
          <Input placeholder='Ex.: foto_medidor_instalado' maxLength={120} />
        </Form.Item>

        <Form.Item
          name='tipoResposta'
          label='Tipo de Resposta'
          rules={[
            { required: true, message: 'Tipo de resposta é obrigatório' },
            { min: 1, max: 50, message: 'Tipo de resposta deve ter entre 1 e 50 caracteres' },
          ]}
        >
          <Select
            options={[
              { value: 'texto', label: 'Texto' },
              { value: 'numero', label: 'Número' },
              { value: 'booleano', label: 'Booleano' },
              { value: 'data', label: 'Data' },
              { value: 'opcao', label: 'Opção' },
            ]}
            showSearch
            placeholder='Selecione o tipo de resposta'
          />
        </Form.Item>

        <Form.Item
          name='ordem'
          label='Ordem'
          rules={[{ required: true, message: 'Ordem é obrigatória' }]}
        >
          <InputNumber min={0} precision={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name='hintResposta'
          label='Dica para Resposta'
          rules={[{ max: 255, message: 'Dica deve ter no máximo 255 caracteres' }]}
        >
          <Input placeholder='Ajuda exibida para o usuário (opcional)' maxLength={255} />
        </Form.Item>

        <Form.Item name='obrigaFoto' label='Obrigar Foto' valuePropName='checked'>
          <Switch checkedChildren='Sim' unCheckedChildren='Não' />
        </Form.Item>

        <Form.Item name='ativo' label='Ativo' valuePropName='checked'>
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
