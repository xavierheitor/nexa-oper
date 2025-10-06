'use client';

import { Base, Contrato } from '@nexa-oper/db';
import { Button, Form, Input, message, Select, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { listBases } from '../../../../lib/actions/base/list';
import { listContratos } from '../../../../lib/actions/contrato/list';

// Importações do Ant Design e React

// Interface que define a estrutura dos dados do formulário
// Deve corresponder aos campos que serão enviados para a Server Action
export interface EletricistaFormData {
  nome: string; // Campo obrigatório
  matricula: string; // Campo obrigatório
  telefone: string; // Campo obrigatório
  estado: string; // Campo obrigatório
  contratoId: number; // Campo obrigatório
  baseId: number; // Campo obrigatório
}

// Interface que define as props aceitas pelo componente
interface EletricistaFormProps {
  onSubmit: (values: EletricistaFormData) => void;
  initialValues?: Partial<EletricistaFormData>;
  loading?: boolean;
}

const FORM_LAYOUT = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

export default function EletricistaForm({
  onSubmit, // Função que será chamada ao submeter o formulário
  initialValues, // Valores para pré-popular o formulário (usado na edição)
  loading = false, // Estado de loading (padrão: false)
}: EletricistaFormProps) {
  // Hook do Ant Design para controlar o formulário
  const [form] = Form.useForm();

  // Estados para armazenar os dados dos selects
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [loadingSelects, setLoadingSelects] = useState(true);

  // Effect para carregar os dados dos selects ao montar o componente
  useEffect(() => {
    const loadSelectData = async () => {
      try {
        setLoadingSelects(true);

        // Carrega contratos e bases em paralelo
        const [contratosResponse, basesResponse] = await Promise.all([
          listContratos({
            page: 1,
            pageSize: 100,
            orderBy: 'nome',
            orderDir: 'asc',
          }),
          listBases({
            page: 1,
            pageSize: 100,
            orderBy: 'nome',
            orderDir: 'asc',
          }),
        ]);

        setContratos(contratosResponse.data?.data || []);
        setBases(basesResponse.data?.data || []);
      } catch (error) {
        console.error('Erro ao carregar dados dos selects:', error);
        message.error('Erro ao carregar dados dos selects');
      } finally {
        setLoadingSelects(false);
      }
    };

    loadSelectData();
  }, []);

  // Effect para gerenciar os valores iniciais do formulário
  useEffect(() => {
    if (initialValues) {
      // Se há valores iniciais (modo edição), pré-popula o formulário
      form.setFieldsValue(initialValues);
    } else {
      // Se não há valores (modo criação), limpa todos os campos
      form.resetFields();
    }
  }, [initialValues, form]);

  // Se está em loading, mostra apenas o spinner (evita interação durante submit)
  if (loading) return <Spin spinning />;

  // Renderização do formulário
  return (
    <Form
      form={form} // Instância do formulário controlada pelo hook
      layout="vertical" // Layout com labels acima dos campos
      onFinish={onSubmit} // Função chamada quando o formulário é válido e submetido
    >
      {/* Campo Nome do Eletricista */}
      <Form.Item
        name="nome" // Nome do campo (deve corresponder à interface EletricistaFormData)
        label="Nome do Eletricista" // Label exibido acima do campo
        rules={[
          // Regras de validação do campo
          { required: true, message: 'Nome é obrigatório' }, // Campo obrigatório
          { min: 1, max: 255, message: 'Nome deve ter entre 1 e 255 caracteres' } // Validação de tamanho
        ]}
      >
        <Input autoFocus // Foco automático no campo quando o formulário abre
          placeholder="Digite o nome do eletricista" />
      </Form.Item>
      {/* Campo Matrícula do Eletricista */}
      <Form.Item
        name="matricula" // Nome do campo (deve corresponder à interface EletricistaFormData)
        label="Matrícula do Eletricista" // Label exibido acima do campo
        rules={[
          // Regras de validação do campo
          { required: true, message: 'Matrícula é obrigatória' }, // Campo obrigatório
          { min: 1, max: 255, message: 'Matrícula deve ter entre 1 e 255 caracteres' } // Validação de tamanho
        ]}
      >
        <Input placeholder="Digite a matrícula do eletricista" />
      </Form.Item>
      {/* Campo Telefone do Eletricista */}
      <Form.Item
        name="telefone" // Nome do campo (deve corresponder à interface EletricistaFormData)
        label="Telefone do Eletricista" // Label exibido acima do campo
        rules={[
          // Regras de validação do campo
          { required: true, message: 'Telefone é obrigatório' }, // Campo obrigatório
          { min: 1, max: 255, message: 'Telefone deve ter entre 1 e 255 caracteres' } // Validação de tamanho
        ]}
      >
        <Input placeholder="Digite o telefone do eletricista" />
      </Form.Item>
      {/* Campo Estado do Eletricista */}
      <Form.Item
        name="estado" // Nome do campo (deve corresponder à interface EletricistaFormData)
        label="Estado do Eletricista" // Label exibido acima do campo
        rules={[
          // Regras de validação do campo
          { required: true, message: 'Estado é obrigatório' }, // Campo obrigatório
          { min: 1, max: 255, message: 'Estado deve ter entre 1 e 255 caracteres' } // Validação de tamanho
        ]}
      >
        <Input placeholder="Digite o estado do eletricista" />
      </Form.Item>
      {/* Campo Contrato */}
      <Form.Item
        name="contratoId" // Nome do campo (deve corresponder à interface EletricistaFormData)
        label="Contrato" // Label exibido acima do campo
        rules={[
          // Regras de validação do campo
          { required: true, message: 'Contrato é obrigatório' }
        ]}
      >
        <Select placeholder="Selecione o contrato" loading={loadingSelects} showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={contratos.map(contrato => ({ value: contrato.id, label: contrato.nome }))} />
      </Form.Item>
      {/* Campo Base */}
      <Form.Item
        name="baseId" // Nome do campo (deve corresponder à interface EletricistaFormData)
        label="Base" // Label exibido acima do campo
        rules={[
          // Regras de validação do campo
          { required: true, message: 'Base é obrigatória' }
        ]}
      >
        <Select placeholder="Selecione a base" loading={loadingSelects} showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={bases.map(base => ({ value: base.id, label: base.nome }))} />
      </Form.Item>
      {/* Botão de Submit */}
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading || loadingSelects} disabled={loadingSelects}>Salvar</Button>
      </Form.Item>
    </Form>
  );

}
