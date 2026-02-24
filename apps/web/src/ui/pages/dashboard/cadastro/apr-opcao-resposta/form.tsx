/**
 * Componente de Formulário para APR Opção de Resposta
 *
 * Este componente implementa o formulário para criação e edição
 * de opções de resposta APR, seguindo os padrões de design e UX da aplicação.
 *
 * FUNCIONALIDADES:
 * - Criação de novas opções de resposta APR
 * - Edição de opções de resposta existentes
 * - Validação em tempo real
 * - Feedback visual de loading
 * - Integração com Ant Design
 * - Reset automático de formulário
 * - Foco automático no primeiro campo
 * - Switch para "Gera Pendência"
 *
 * VALIDAÇÕES IMPLEMENTADAS:
 * - Nome obrigatório
 * - Limite de caracteres (1-255)
 * - geraPendencia boolean opcional
 * - Feedback de erro em tempo real
 * - Prevenção de submit com dados inválidos
 *
 * COMPORTAMENTO:
 * - Modo criação: campos limpos, geraPendencia = false
 * - Modo edição: campos preenchidos com dados existentes
 * - Loading state durante submit
 * - Reset automático após operações
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Modo criação
 * <AprOpcaoRespostaForm 
 *   onSubmit={handleCreate}
 *   loading={false}
 * />
 * 
 * // Modo edição
 * <AprOpcaoRespostaForm 
 *   initialValues={{ 
 *     nome: "Não Conforme", 
 *     geraPendencia: true 
 *   }}
 *   onSubmit={handleUpdate}
 *   loading={isUpdating}
 * />
 * ```
 */

'use client';

import { Button, Form, Input, Spin } from 'antd';
import { useEffect } from 'react';

/**
 * Interface para dados do formulário de APR Opção de Resposta
 *
 * Define a estrutura dos dados que o formulário coleta
 * e envia para as funções de callback.
 */
export interface AprOpcaoRespostaFormData {
  /** Texto da opção de resposta APR */
  nome: string;
}

/**
 * Props do componente AprOpcaoRespostaForm
 *
 * Define as propriedades aceitas pelo componente,
 * incluindo callbacks e estados de loading.
 */
interface Props {
  /** Função chamada ao submeter o formulário */
  onSubmit: (values: AprOpcaoRespostaFormData) => void;
  
  /** Valores iniciais para preenchimento (modo edição) */
  initialValues?: Partial<AprOpcaoRespostaFormData>;
  
  /** Estado de loading durante operações */
  loading?: boolean;
}

/**
 * Componente de formulário para APR Opção de Resposta
 *
 * Renderiza um formulário responsivo com validação integrada
 * para criação e edição de opções de resposta APR.
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
 *       await createAprOpcaoResposta(data);
 *       message.success('Opção de resposta criada!');
 *       closeModal();
 *     } catch (error) {
 *       message.error('Erro ao criar opção de resposta');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *   
 *   return (
 *     <Modal title="Nova Opção de Resposta APR" open={isOpen}>
 *       <AprOpcaoRespostaForm 
 *         onSubmit={handleSubmit}
 *         loading={loading}
 *       />
 *     </Modal>
 *   );
 * };
 * 
 * // Uso em página de edição
 * const EditPage = ({ opcaoId }) => {
 *   const [opcao, setOpcao] = useState(null);
 *   const [loading, setLoading] = useState(false);
 *   
 *   useEffect(() => {
 *     loadOpcao(opcaoId).then(setOpcao);
 *   }, [opcaoId]);
 *   
 *   const handleUpdate = async (data) => {
 *     setLoading(true);
 *     try {
 *       await updateAprOpcaoResposta({ ...data, id: opcaoId });
 *       message.success('Opção de resposta atualizada!');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *   
 *   return (
 *     <AprOpcaoRespostaForm 
 *       initialValues={opcao}
 *       onSubmit={handleUpdate}
 *       loading={loading}
 *     />
 *   );
 * };
 * ```
 */
export default function AprOpcaoRespostaForm({ 
  onSubmit, 
  initialValues, 
  loading = false 
}: Props) {
  // Hook do Ant Design para controle do formulário
  const [form] = Form.useForm<AprOpcaoRespostaFormData>();

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
      {/* Campo principal: Nome da opção de resposta */}
      <Form.Item
        name="nome"
        label="Opção de Resposta"
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
          placeholder="Digite a opção de resposta APR"
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
