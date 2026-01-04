/**
 * Componente de Alerta de Erro Reutilizável
 *
 * Exibe mensagens de erro de forma padronizada com opção de retry.
 * Usado em conjunto com hooks de fetching de dados como useDataFetch.
 *
 * CARACTERÍSTICAS:
 * - Exibe erro de forma visual e clara
 * - Suporte a retry manual via callback
 * - Estilização consistente com Ant Design
 * - Não renderiza nada quando não há erro (retorna null)
 *
 * EXEMPLO DE USO:
 * ```tsx
 * const { data, loading, error, refetch } = useDataFetch(fetcher);
 *
 * return (
 *   <>
 *     <ErrorAlert error={error} onRetry={refetch} />
 *     {loading && <Spin />}
 *     {data && <Table dataSource={data} />}
 *   </>
 * );
 * ```
 */

'use client';

import { Alert, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface ErrorAlertProps {
  /**
   * Mensagem de erro a ser exibida
   * Se null ou undefined, o componente não renderiza nada
   */
  error: string | null | undefined;

  /**
   * Callback opcional para retry manual
   * Se fornecido, exibe um botão "Tentar Novamente"
   */
  onRetry?: () => void;

  /**
   * Texto customizado para o botão de retry
   * @default "Tentar Novamente"
   */
  retryButtonText?: string;

  /**
   * Mensagem customizada para o título do alerta
   * @default "Erro ao carregar dados"
   */
  message?: string;

  /**
   * Estilo adicional para o componente
   */
  style?: React.CSSProperties;

  /**
   * Classe CSS adicional
   */
  className?: string;
}

/**
 * Componente de Alerta de Erro
 *
 * Renderiza um Alert do Ant Design com mensagem de erro e opção de retry.
 * Retorna null se não houver erro, permitindo uso condicional direto.
 */
export function ErrorAlert({
  error,
  onRetry,
  retryButtonText = 'Tentar Novamente',
  message = 'Erro ao carregar dados',
  style,
  className,
}: ErrorAlertProps) {
  // Não renderiza nada se não houver erro
  if (!error) {
    return null;
  }

  return (
    <Alert
      type="error"
      message={message}
      description={error}
      action={
        onRetry && (
          <Button
            size="small"
            danger
            icon={<ReloadOutlined />}
            onClick={onRetry}
          >
            {retryButtonText}
          </Button>
        )
      }
      style={{ marginBottom: 16, ...style }}
      className={className}
      showIcon
      closable={!onRetry} // Permite fechar apenas se não tiver retry
    />
  );
}

