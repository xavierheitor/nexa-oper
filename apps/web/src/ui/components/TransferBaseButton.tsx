'use client';

import { Button } from 'antd';
import { SwapOutlined } from '@ant-design/icons';

interface TransferBaseButtonProps {
  onTransfer: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function TransferBaseButton({
  onTransfer,
  loading = false,
  disabled = false
}: TransferBaseButtonProps) {
  return (
    <Button
      type="default"
      size="small"
      icon={<SwapOutlined />}
      onClick={onTransfer}
      loading={loading}
      disabled={disabled}
      title="Transferir Base"
    >
      Transferir
    </Button>
  );
}
