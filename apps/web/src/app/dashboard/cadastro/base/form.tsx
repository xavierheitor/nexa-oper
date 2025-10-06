'use client';

// Importações do Ant Design e React
import { Button, Form, Input, Select, Spin } from 'antd';
import { useEffect, useState } from 'react';

// Importações de actions para buscar contratos
import { listContratos } from '@/lib/actions/contrato/list';

// Interface que define a estrutura dos dados do formulário
// Deve corresponder aos campos que serão enviados para a Server Action
export interface BaseFormData {
  nome: string; // Campo obrigatório
  contratoId: number; // Campo obrigatório
}

// Interface que define as props aceitas pelo componente
interface BaseFormProps {
  onSubmit: (values: BaseFormData) => void; // Função chamada quando o formulário é submetido
  initialValues?: Partial<BaseFormData>; // Valores iniciais para edição (opcional)
  loading?: boolean; // Estado de loading para desabilitar o botão durante submit
}

// Componente de formulário para criação/edição de bases
export default function BaseForm({
  onSubmit, // Função que será chamada ao submeter o formulário
  initialValues, // Valores para pré-popular o formulário (usado na edição)
  loading = false, // Estado de loading (padrão: false)
}: BaseFormProps) {
  // Hook do Ant Design para controlar o formulário
  const [form] = Form.useForm();

  // Estado para armazenar a lista de contratos
  const [contratos, setContratos] = useState<Array<{ id: number; nome: string }>>([]);
  const [contratosLoading, setContratosLoading] = useState(false);

  // Effect para carregar contratos ao montar o componente
  useEffect(() => {
    const loadContratos = async () => {
      setContratosLoading(true);
      try {
        const result = await listContratos({
          page: 1,
          pageSize: 1000, // Busca todos os contratos
          orderBy: 'nome',
          orderDir: 'asc',
        });

        if (result.success && result.data) {
          setContratos(result.data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar contratos:', error);
        // Fallback com dados mock para desenvolvimento
        setContratos([
          { id: 1, nome: 'Contrato 1' },
          { id: 2, nome: 'Contrato 2' }
        ]);
      } finally {
        setContratosLoading(false);
      }
    };

    loadContratos();
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
  }, [initialValues, form]); // Re-executa quando initialValues ou form mudam

  // Se está em loading, mostra apenas o spinner (evita interação durante submit)
  if (loading) return <Spin spinning />;

  // Renderização do formulário
  return (
    <Form
      form={form} // Instância do formulário controlada pelo hook
      layout="vertical" // Layout com labels acima dos campos
      onFinish={onSubmit} // Função chamada quando o formulário é válido e submetido
    >
      {/* Campo Nome da Base */}
      <Form.Item
        name="nome" // Nome do campo (deve corresponder à interface BaseFormData)
        label="Nome da Base" // Label exibido acima do campo
        rules={[
          // Regras de validação do campo
          { required: true, message: 'Nome é obrigatório' }, // Campo obrigatório
          { min: 1, max: 255, message: 'Nome deve ter entre 1 e 255 caracteres' }, // Validação de tamanho
        ]}
      >
        <Input
          autoFocus // Foco automático no campo quando o formulário abre
          placeholder="Digite o nome da base"
        />
      </Form.Item>

      {/* Campo Contrato */}
      <Form.Item
        name="contratoId" // Nome do campo (deve corresponder à interface BaseFormData)
        label="Contrato" // Label exibido acima do campo
        rules={[
          // Regras de validação do campo
          { required: true, message: 'Contrato é obrigatório' }, // Campo obrigatório
        ]}
      >
        <Select
          placeholder="Selecione um contrato"
          loading={contratosLoading}
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {contratos.map((contrato) => (
            <Select.Option key={contrato.id} value={contrato.id}>
              {contrato.nome}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* Botão de Submit */}
      <Form.Item>
        <Button
          type="primary" // Estilo primário (azul)
          htmlType="submit" // Tipo HTML para submeter o formulário
          block // Ocupa toda a largura disponível
          loading={loading} // Mostra spinner e desabilita quando em loading
        >
          Salvar
        </Button>
      </Form.Item>
    </Form>
  );
}
