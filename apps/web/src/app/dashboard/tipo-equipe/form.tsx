'use client';

// Importações do Ant Design e React
import { Button, Form, Input, Spin } from 'antd';
import { useEffect } from 'react';

// Interface que define a estrutura dos dados do formulário
// Deve corresponder aos campos que serão enviados para a Server Action
export interface TipoEquipeFormData {
  nome: string; // Campo obrigatório
}

// Interface que define as props aceitas pelo componente
interface TipoEquipeFormProps {
  onSubmit: (values: TipoEquipeFormData) => void; // Função chamada quando o formulário é submetido
  initialValues?: Partial<TipoEquipeFormData>; // Valores iniciais para edição (opcional)
  loading?: boolean; // Estado de loading para desabilitar o botão durante submit
}

// Componente de formulário para criação/edição de tipos de equipe
export default function TipoEquipeForm({
  onSubmit, // Função que será chamada ao submeter o formulário
  initialValues, // Valores para pré-popular o formulário (usado na edição)
  loading = false, // Estado de loading (padrão: false)
}: TipoEquipeFormProps) {
  // Hook do Ant Design para controlar o formulário
  const [form] = Form.useForm();

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
      {/* Campo Nome do Tipo de Equipe */}
      <Form.Item
        name="nome" // Nome do campo (deve corresponder à interface TipoEquipeFormData)
        label="Nome do Tipo de Equipe" // Label exibido acima do campo
        rules={[
          // Regras de validação do campo
          { required: true, message: 'Nome é obrigatório' }, // Campo obrigatório
          { min: 1, max: 255, message: 'Nome deve ter entre 1 e 255 caracteres' }, // Validação de tamanho
        ]}
      >
        <Input
          autoFocus // Foco automático no campo quando o formulário abre
          placeholder="Digite o nome do tipo de equipe"
        />
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

