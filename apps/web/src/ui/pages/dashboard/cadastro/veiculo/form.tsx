'use client';

// Importações do Ant Design e React
import { Button, Form, Input, InputNumber, Select, Spin, App } from 'antd';
import { useEffect, useState } from 'react';

// Importações das Server Actions para buscar dados dos selects
import { listContratos } from '@/lib/actions/contrato/list';
import { listBases } from '@/lib/actions/base/list';
import { listTiposVeiculo } from '@/lib/actions/tipoVeiculo/list';

// Tipos do Prisma
import { Base, Contrato, TipoVeiculo } from '@nexa-oper/db';

// Interface que define a estrutura dos dados do formulário
// Deve corresponder aos campos que serão enviados para a Server Action
export interface VeiculoFormData {
  placa: string; // Campo obrigatório
  modelo: string; // Campo obrigatório
  ano: number; // Campo obrigatório
  tipoVeiculoId: number; // Campo obrigatório - ID do tipo de veículo
  contratoId: number; // Campo obrigatório - ID do contrato
  baseId: number; // Campo obrigatório - ID da base
}

// Interface que define as props aceitas pelo componente
interface VeiculoFormProps {
  onSubmit: (values: VeiculoFormData) => void; // Função chamada quando o formulário é submetido
  initialValues?: Partial<VeiculoFormData>; // Valores iniciais para edição (opcional)
  loading?: boolean; // Estado de loading para desabilitar o botão durante submit
}

// Componente de formulário para criação/edição de veículos
export default function VeiculoForm({
  onSubmit, // Função que será chamada ao submeter o formulário
  initialValues, // Valores para pré-popular o formulário (usado na edição)
  loading = false, // Estado de loading (padrão: false)
}: VeiculoFormProps) {
  const { message } = App.useApp();
  // Hook do Ant Design para controlar o formulário
  const [form] = Form.useForm();

  // Estados para armazenar os dados dos selects
  const [tiposVeiculo, setTiposVeiculo] = useState<TipoVeiculo[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
  const [loadingSelects, setLoadingSelects] = useState(true);

  // Effect para carregar os dados dos selects ao montar o componente
  useEffect(() => {
    const loadSelectData = async () => {
      try {
        setLoadingSelects(true);

        // Carrega tipos de veículo, contratos e bases em paralelo
        const [tiposResponse, contratosResponse, basesResponse] = await Promise.all([
          listTiposVeiculo({
            page: 1,
            pageSize: 100, // Carrega todos os tipos disponíveis
            orderBy: 'nome',
            orderDir: 'asc',
          }),
          listContratos({
            page: 1,
            pageSize: 100, // Carrega todos os contratos disponíveis
            orderBy: 'nome',
            orderDir: 'asc',
          }),
          listBases({
            page: 1,
            pageSize: 100, // Carrega todas as bases disponíveis
            orderBy: 'nome',
            orderDir: 'asc',
          }),
        ]);

        setTiposVeiculo(tiposResponse.data?.data || []);
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
  }, [message]);

  // Effect para gerenciar os valores iniciais do formulário
  useEffect(() => {
    if (initialValues) {
      // Se há valores iniciais (modo edição), pré-popula o formulário
      form.setFieldsValue(initialValues);
    } else {
      // Se não há valores (modo criação), limpa todos os campos
      form.resetFields();
    }
  }, [initialValues, form]); // Re-executa quando initialValues ou form mudam

  // Renderização do formulário
  return (
    <Spin spinning={loading}>
      <Form
      form={form} // Instância do formulário controlada pelo hook
      layout="vertical" // Layout com labels acima dos campos
      onFinish={onSubmit} // Função chamada quando o formulário é válido e submetido
    >
      {/* Campo Placa do Veículo */}
      <Form.Item
        name="placa" // Nome do campo (deve corresponder à interface VeiculoFormData)
        label="Placa do Veículo" // Label exibido acima do campo
        rules={[
          // Regras de validação do campo
          { required: true, message: 'Placa é obrigatória' }, // Campo obrigatório
          { min: 1, max: 255, message: 'Placa deve ter entre 1 e 255 caracteres' }, // Validação de tamanho
          {
            pattern: /^[A-Z]{3}-?[0-9]{4}$|^[A-Z]{3}-?[0-9][A-Z][0-9]{2}$/,
            message: 'Formato de placa inválido (ex: ABC1234, ABC-1234, ABC1D23, ABC-1D23)'
          } // Validação de formato de placa brasileira (antiga e Mercosul)
        ]}
      >
        <Input
          autoFocus // Foco automático no campo quando o formulário abre
          placeholder="Digite a placa do veículo (ex: ABC1234 ou ABC1D23)"
          style={{ textTransform: 'uppercase' }} // Força maiúsculas
          maxLength={8} // Máximo 8 caracteres (3 letras + 4 números/letras + hífen opcional)
          onInput={(e) => {
            // Remove caracteres não permitidos e força maiúsculas
            const target = e.target as HTMLInputElement;
            const value = target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
            if (target.value !== value) {
              target.value = value;
            }
          }}
        />
      </Form.Item>

      {/* Campo Modelo do Veículo */}
      <Form.Item
        name="modelo" // Nome do campo
        label="Modelo do Veículo" // Label do campo
        rules={[
          // Mesmas validações do campo placa
          { required: true, message: 'Modelo é obrigatório' },
          { min: 1, max: 255, message: 'Modelo deve ter entre 1 e 255 caracteres' }
        ]}
      >
        <Input placeholder="Digite o modelo do veículo (ex: Civic, Corolla)" />
      </Form.Item>

      {/* Campo Ano do Veículo */}
      <Form.Item
        name="ano" // Nome do campo
        label="Ano do Veículo" // Label do campo
        rules={[
          { required: true, message: 'Ano é obrigatório' },
          {
            type: 'number',
            min: 1900,
            max: new Date().getFullYear() + 1,
            message: `Ano deve estar entre 1900 e ${new Date().getFullYear() + 1}`
          }
        ]}
      >
        <InputNumber
          placeholder="Digite o ano do veículo"
          style={{ width: '100%' }}
          min={1900}
          max={new Date().getFullYear() + 1}
        />
      </Form.Item>

      {/* Campo Tipo de Veículo */}
      <Form.Item
        name="tipoVeiculoId" // Nome do campo
        label="Tipo de Veículo" // Label do campo
        rules={[
          { required: true, message: 'Tipo de veículo é obrigatório' }
        ]}
      >
        <Select
          placeholder="Selecione o tipo de veículo"
          loading={loadingSelects}
          showSearch // Permite busca dentro do select
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={tiposVeiculo.map(tipo => ({
            value: tipo.id,
            label: tipo.nome,
          }))}
        />
      </Form.Item>

      {/* Campo Contrato */}
      <Form.Item
        name="contratoId" // Nome do campo
        label="Contrato" // Label do campo
        rules={[
          { required: true, message: 'Contrato é obrigatório' }
        ]}
      >
        <Select
          placeholder="Selecione o contrato"
          loading={loadingSelects}
          showSearch // Permite busca dentro do select
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={contratos.map(contrato => ({
            value: contrato.id,
            label: `${contrato.nome} (${contrato.numero})`,
          }))}
        />
      </Form.Item>

      {/* Campo Base */}
      <Form.Item
        name="baseId" // Nome do campo
        label="Base" // Label do campo
        rules={[
          { required: true, message: 'Base é obrigatória' }
        ]}
      >
        <Select
          placeholder="Selecione a base"
          loading={loadingSelects}
          showSearch // Permite busca dentro do select
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={bases.map(base => ({
            value: base.id,
            label: base.nome,
          }))}
        />
      </Form.Item>

      {/* Botão de Submit */}
      <Form.Item>
        <Button
          type="primary" // Estilo primário (azul)
          htmlType="submit" // Tipo HTML para submeter o formulário
          block // Ocupa toda a largura disponível
          loading={loading || loadingSelects} // Mostra spinner e desabilita quando em loading
          disabled={loadingSelects} // Desabilita se ainda está carregando os selects
        >
          Salvar
        </Button>
      </Form.Item>
    </Form>
    </Spin>
  );
}
