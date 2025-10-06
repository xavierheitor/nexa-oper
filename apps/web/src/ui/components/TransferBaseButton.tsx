'use client';

import { Button, message } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { useState } from 'react';

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
