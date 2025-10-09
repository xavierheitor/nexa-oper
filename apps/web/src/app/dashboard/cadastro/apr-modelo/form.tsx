/**
 * Componente de Formulário para APR (Análise Preliminar de Risco)
 *
 * Este componente implementa o formulário para criação e edição
 * de APRs, seguindo os padrões de design e UX da aplicação.
 * Inclui Transfer components para vinculação de perguntas e opções de resposta.
 *
 * FUNCIONALIDADES:
 * - Criação de novas APRs
 * - Edição de APRs existentes
 * - Validação em tempo real
 * - Feedback visual de loading
 * - Integração com Ant Design
 * - Transfer components para seleção múltipla
 * - Reset automático de formulário
 * - Foco automático no primeiro campo
 * - Carregamento assíncrono de dados
 *
 * COMPONENTES TRANSFER:
 * - Transfer de Perguntas APR: Permite selecionar perguntas disponíveis
 * - Transfer de Opções de Resposta: Permite selecionar opções disponíveis
 * - Ambos com busca integrada e interface responsiva
 *
 * VALIDAÇÕES IMPLEMENTADAS:
 * - Nome obrigatório
 * - Limite de caracteres (1-255)
 * - Seleções opcionais nos Transfers
 * - Feedback de erro em tempo real
 * - Prevenção de submit com dados inválidos
 *
 * COMPORTAMENTO:
 * - Modo criação: campos limpos, transfers vazios
 * - Modo edição: campos preenchidos, transfers com seleções atuais
 * - Loading state durante submit e carregamento
 * - Reset automático após operações
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Modo criação
 * <AprForm 
 *   onSubmit={handleCreate}
 *   loading={false}
 * />
 * 
 * // Modo edição
 * <AprForm 
 *   initialValues={{ 
 *     id: 1,
 *     nome: "APR Soldagem",
 *     perguntaIds: [1, 2, 3],
 *     opcaoRespostaIds: [1, 2]
 *   }}
 *   onSubmit={handleUpdate}
 *   loading={isUpdating}
 * />
 * ```
 */

'use client';

import { Button, Card, Form, Input, Spin, Transfer, Typography, App } from 'antd';
import type { TransferItem } from 'antd/es/transfer';
import { useEffect, useMemo, useState } from 'react';

import { getApr } from '@/lib/actions/apr/get';
import { listAprOpcoesResposta } from '@/lib/actions/aprOpcaoResposta/list';
import { listAprPerguntas } from '@/lib/actions/aprPergunta/list';

import type { AprOpcaoResposta, AprPergunta } from '@nexa-oper/db';

const { Title } = Typography;

/**
 * Interface para dados do formulário de APR
 *
 * Define a estrutura dos dados que o formulário coleta
 * e envia para as funções de callback.
 */
export interface AprFormData {
  /** Nome/título da APR */
  nome: string;
  
  /** Array de IDs das perguntas APR selecionadas */
  perguntaIds: number[];
  
  /** Array de IDs das opções de resposta APR selecionadas */
  opcaoRespostaIds: number[];
}

/**
 * Props do componente AprForm
 *
 * Define as propriedades aceitas pelo componente,
 * incluindo callbacks e estados de loading.
 */
interface Props {
  /** Função chamada ao submeter o formulário */
  onSubmit: (values: AprFormData) => void;
  
  /** Valores iniciais para preenchimento (modo edição) */
  initialValues?: Partial<AprFormData & { id: number }>;
  
  /** Estado de loading durante operações */
  loading?: boolean;
}

/**
 * Componente de formulário para APR
 *
 * Renderiza um formulário responsivo com validação integrada
 * e Transfer components para criação e edição de APRs.
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
 *       await createApr(data);
 *       message.success('APR criada!');
 *       closeModal();
 *     } catch (error) {
 *       message.error('Erro ao criar APR');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *   
 *   return (
 *     <Modal title="Nova APR" open={isOpen}>
 *       <AprForm 
 *         onSubmit={handleSubmit}
 *         loading={loading}
 *       />
 *     </Modal>
 *   );
 * };
 * ```
 */
export default function AprForm({ onSubmit, initialValues, loading = false }: Props) {
  const { message } = App.useApp();
  // Hook do Ant Design para controle do formulário
  const [form] = Form.useForm<AprFormData>();
  
  // Estados para dados dos Transfer components
  const [perguntas, setPerguntas] = useState<AprPergunta[]>([]);
  const [opcoes, setOpcoes] = useState<AprOpcaoResposta[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  // Estados para controle dos Transfer components
  const [targetPerguntas, setTargetPerguntas] = useState<string[]>([]);
  const [targetOpcoes, setTargetOpcoes] = useState<string[]>([]);

  /**
   * Memoização dos itens do Transfer de Perguntas
   *
   * Converte array de perguntas APR para formato do Transfer component.
   */
  const perguntaItems = useMemo<TransferItem[]>(
    () => perguntas.map(p => ({ key: String(p.id), title: p.nome })),
    [perguntas]
  );

  /**
   * Memoização dos itens do Transfer de Opções de Resposta
   *
   * Converte array de opções de resposta APR para formato do Transfer component.
   */
  const opcaoItems = useMemo<TransferItem[]>(
    () => opcoes.map(o => ({ key: String(o.id), title: o.nome })),
    [opcoes]
  );

  /**
   * Effect para carregamento inicial de dados
   *
   * Carrega assincronamente perguntas e opções de resposta APR
   * disponíveis para os Transfer components.
   */
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingSources(true);
        const [perguntasRes, opcoesRes] = await Promise.all([
          listAprPerguntas({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
          listAprOpcoesResposta({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
        ]);
        
        setPerguntas(perguntasRes.data?.data || []);
        setOpcoes(opcoesRes.data?.data || []);
      } catch (e) {
        console.error(e);
        message.error('Erro ao carregar dados');
      } finally {
        setLoadingSources(false);
      }
    };
    load();
  }, []);

  /**
   * Effect para gerenciar valores iniciais
   *
   * Preenche o formulário e Transfer components com dados existentes (modo edição)
   * ou limpa os campos (modo criação).
   */
  useEffect(() => {
    const applyInitial = async () => {
      if (initialValues) {
        // Preenche campos básicos do formulário
        form.setFieldsValue({
          nome: initialValues.nome as any,
          perguntaIds: (initialValues.perguntaIds || []) as any,
          opcaoRespostaIds: (initialValues.opcaoRespostaIds || []) as any,
        });

        // Se tem ID, é edição - carrega relacionamentos atuais
        if ((initialValues as any).id) {
          const res = await getApr({ id: (initialValues as any).id });
          const data = res.data as any;
          if (data) {
            // Extrai IDs dos relacionamentos para os Transfer components
            setTargetPerguntas((data.AprPerguntaRelacao || []).map((r: any) => String(r.aprPerguntaId)));
            setTargetOpcoes((data.AprOpcaoRespostaRelacao || []).map((r: any) => String(r.aprOpcaoRespostaId)));
          }
        } else {
          // Modo criação com valores iniciais fornecidos
          setTargetPerguntas((initialValues.perguntaIds || []).map(String));
          setTargetOpcoes((initialValues.opcaoRespostaIds || []).map(String));
        }
      } else {
        // Modo criação limpo
        form.resetFields();
        setTargetPerguntas([]);
        setTargetOpcoes([]);
      }
    };
    applyInitial();
  }, [initialValues, form]);

  // Exibe spinner durante loading
  if (loading) return <Spin spinning />;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(vals) =>
        onSubmit({
          nome: vals.nome,
          perguntaIds: targetPerguntas.map(Number),
          opcaoRespostaIds: targetOpcoes.map(Number),
        })
      }
    >
      {/* Seção: Dados básicos da APR */}
      <Title level={5}>Dados da APR</Title>
      <Form.Item 
        name="nome" 
        label="Nome da APR" 
        rules={[
          { required: true, message: 'Nome é obrigatório' }, 
          { min: 1, max: 255, message: 'Nome deve ter entre 1 e 255 caracteres' }
        ]}
      >
        <Input 
          autoFocus
          placeholder="Digite o nome da APR"
          showCount
          maxLength={255}
        />
      </Form.Item>

      {/* Transfer Component: Perguntas APR */}
      <Card 
        size="small" 
        title="Perguntas APR" 
        style={{ marginTop: 12 }}
        loading={loadingSources}
      >
        <Transfer
          dataSource={perguntaItems}
          targetKeys={targetPerguntas}
          onChange={(nextTarget) => setTargetPerguntas(nextTarget.map(String))}
          render={item => item.title as string}
          listStyle={{ width: '48%', height: 300 }}
          titles={["Disponíveis", "Selecionadas"]}
          showSearch
          filterOption={(inputValue, item) => 
            item.title!.toLowerCase().includes(inputValue.toLowerCase())
          }
          disabled={loadingSources}
        />
      </Card>

      {/* Transfer Component: Opções de Resposta APR */}
      <Card 
        size="small" 
        title="Opções de Resposta APR" 
        style={{ marginTop: 12 }}
        loading={loadingSources}
      >
        <Transfer
          dataSource={opcaoItems}
          targetKeys={targetOpcoes}
          onChange={(nextTarget) => setTargetOpcoes(nextTarget.map(String))}
          render={item => item.title as string}
          listStyle={{ width: '48%', height: 300 }}
          titles={["Disponíveis", "Selecionadas"]}
          showSearch
          filterOption={(inputValue, item) => 
            item.title!.toLowerCase().includes(inputValue.toLowerCase())
          }
          disabled={loadingSources}
        />
      </Card>

      {/* Botão de submit */}
      <Form.Item style={{ marginTop: 16 }}>
        <Button 
          type="primary" 
          htmlType="submit" 
          block 
          loading={loading || loadingSources}
          disabled={loadingSources}
        >
          Salvar APR
        </Button>
      </Form.Item>
    </Form>
  );
}
