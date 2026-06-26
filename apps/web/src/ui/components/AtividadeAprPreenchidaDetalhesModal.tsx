'use client';

import { FileProtectOutlined, ReloadOutlined } from '@ant-design/icons';
import { getAprPreenchidaDetalhe } from '@/lib/actions/atividade/getAprPreenchidaDetalhe';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import type { AtividadeAprPreenchidaDetalhe } from '@/lib/types/atividadeDashboard';
import AprPreenchidaDetalheContent from '@/ui/components/AprPreenchidaDetalheContent';
import {
  Alert,
  Button,
  Empty,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useEffect } from 'react';

const { Text } = Typography;

interface AtividadeAprPreenchidaDetalhesModalProps {
  open: boolean;
  aprPreenchidaId: number | null;
  aprNome?: string | null;
  numeroDocumento?: string | null;
  onClose: () => void;
}

export default function AtividadeAprPreenchidaDetalhesModal({
  open,
  aprPreenchidaId,
  aprNome,
  numeroDocumento,
  onClose,
}: AtividadeAprPreenchidaDetalhesModalProps) {
  const {
    data: apr,
    loading,
    error,
    refetch,
    reset,
  } = useDataFetch<AtividadeAprPreenchidaDetalhe | null>(
    async () => {
      if (!aprPreenchidaId) return null;

      const result = await getAprPreenchidaDetalhe({ id: aprPreenchidaId });
      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar APR');
      }

      return (result.data || null) as AtividadeAprPreenchidaDetalhe | null;
    },
    [aprPreenchidaId],
    { immediate: false },
  );

  useEffect(() => {
    if (open && aprPreenchidaId) {
      void refetch();
    } else if (!open) {
      reset();
    }
  }, [open, aprPreenchidaId, refetch, reset]);

  const tituloApr = apr?.apr?.nome || aprNome || 'APR';

  return (
    <Modal
      title={
        <Space>
          <FileProtectOutlined />
          <span>{tituloApr}</span>
          {numeroDocumento ? (
            <Tag color='blue'>OS {numeroDocumento}</Tag>
          ) : null}
          {aprPreenchidaId ? (
            <Text type='secondary'>#{aprPreenchidaId}</Text>
          ) : null}
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1100}
      destroyOnHidden
    >
      <div style={{ marginBottom: 12, textAlign: 'right' }}>
        <Button
          icon={<ReloadOutlined />}
          size='small'
          onClick={() => void refetch()}
          loading={loading}
        >
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size='large' />
        </div>
      ) : null}

      {!loading && error ? (
        <Alert
          type='error'
          showIcon
          message='Erro ao carregar APR'
          description={error}
        />
      ) : null}

      {!loading && !error && !apr ? (
        <Empty description='APR não encontrada' />
      ) : null}

      {!loading && !error && apr ? <AprPreenchidaDetalheContent apr={apr} /> : null}
    </Modal>
  );
}
