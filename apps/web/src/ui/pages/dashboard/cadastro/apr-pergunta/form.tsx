/**
 * Componente de Formulário para APR Pergunta
 *
 * Este componente implementa o formulário para criação e edição
 * de perguntas APR, seguindo os padrões de design e UX da aplicação.
 *
 * FUNCIONALIDADES:
 * - Criação de novas perguntas APR
 * - Edição de perguntas existentes
 * - Validação em tempo real
 * - Feedback visual de loading
 * - Integração com Ant Design
 * - Reset automático de formulário
 * - Foco automático no primeiro campo
 *
 * VALIDAÇÕES IMPLEMENTADAS:
 * - Nome obrigatório
 * - Limite de caracteres (1-255)
 * - Feedback de erro em tempo real
 * - Prevenção de submit com dados inválidos
 *
 * COMPORTAMENTO:
 * - Modo criação: campos limpos
 * - Modo edição: campos preenchidos com dados existentes
 * - Loading state durante submit
 * - Reset automático após operações
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Modo criação
 * <AprPerguntaForm 
 *   onSubmit={handleCreate}
 *   loading={false}
 * />
 * 
 * // Modo edição
 * <AprPerguntaForm 
 *   initialValues={{ nome: "Pergunta existente" }}
 *   onSubmit={handleUpdate}
 *   loading={isUpdating}
 * />
 * ```
 */

'use client';

import { Button, Form, Input, Spin } from 'antd';
import { useEffect } from 'react';

/**
 * Interface para dados do formulário de APR Pergunta
 *
 * Define a estrutura dos dados que o formulário coleta
 * e envia para as funções de callback.
 */
export interface AprPerguntaFormData { 
  /** Texto da pergunta APR */
  nome: string;
}

/**
 * Props do componente AprPerguntaForm
 *
 * Define as propriedades aceitas pelo componente,
 * incluindo callbacks e estados de loading.
 */
interface Props {
  /** Função chamada ao submeter o formulário */
  onSubmit: (values: AprPerguntaFormData) => void;
  
  /** Valores iniciais para preenchimento (modo edição) */
  initialValues?: Partial<AprPerguntaFormData>;
  
  /** Estado de loading durante operações */
  loading?: boolean;
}

/**
 * Componente de formulário para APR Pergunta
 *
 * Renderiza um formulário responsivo com validação integrada
 * para criação e edição de perguntas APR.
 *
 * @param props - Propriedades do componente
 * @returns JSX.Element - Formulário renderizado
 *
 * @example
 * ```typescript
 * // Uso em modal de criação
 * const CreateModal = () => {
 *   const [loading, setLoading] = useState(false);
 *   
 *   const handleSubmit = async (data) => {
 *     setLoading(true);
 *     try {
 *       await createAprPergunta(data);
 *       message.success('Pergunta criada!');
 *       closeModal();
 *     } catch (error) {
 *       message.error('Erro ao criar pergunta');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *   
 *   return (
 *     <Modal title="Nova Pergunta APR" open={isOpen}>
 *       <AprPerguntaForm 
 *         onSubmit={handleSubmit}
 *         loading={loading}
 *       />
 *     </Modal>
 *   );
 * };
 * 
 * // Uso em página de edição
 * const EditPage = ({ perguntaId }) => {
 *   const [pergunta, setPergunta] = useState(null);
 *   const [loading, setLoading] = useState(false);
 *   
 *   useEffect(() => {
 *     loadPergunta(perguntaId).then(setPergunta);
 *   }, [perguntaId]);
 *   
 *   const handleUpdate = async (data) => {
 *     setLoading(true);
 *     try {
 *       await updateAprPergunta({ ...data, id: perguntaId });
 *       message.success('Pergunta atualizada!');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *   
 *   return (
 *     <AprPerguntaForm 
 *       initialValues={pergunta}
 *       onSubmit={handleUpdate}
 *       loading={loading}
 *     />
 *   );
 * };
 * ```
 */
export default function AprPerguntaForm({ 
  onSubmit, 
  initialValues, 
  loading = false 
}: Props) {
  // Hook do Ant Design para controle do formulário
  const [form] = Form.useForm();

  /**
   * Effect para gerenciar valores iniciais
   *
   * Preenche o formulário com dados existentes (modo edição)
   * ou limpa os campos (modo criação).
   */
  useEffect(() => {
    if (initialValues) {
      // Modo edição: preenche com dados existentes
      form.setFieldsValue(initialValues);
    } else {
      // Modo criação: limpa todos os campos
      form.resetFields();
    }
  }, [initialValues, form]);

  // Exibe spinner durante loading
  if (loading) {
    return <Spin spinning />;
  }

  return (
    <Form 
      form={form} 
      layout="vertical" 
      onFinish={onSubmit}
    >
      {/* Campo principal: Nome da pergunta */}
      <Form.Item
        name="nome"
        label="Pergunta"
        rules={[
          { 
            required: true, 
            message: 'Nome é obrigatório' 
          },
          { 
            min: 1, 
            max: 255, 
            message: 'Nome deve ter entre 1 e 255 caracteres' 
          },
        ]}
      >
        <Input 
          autoFocus 
          placeholder="Digite a pergunta APR"
          showCount
          maxLength={255}
        />
      </Form.Item>

      {/* Botão de submit */}
      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          block 
          loading={loading}
        >
          Salvar
        </Button>
      </Form.Item>
    </Form>
  );
}
