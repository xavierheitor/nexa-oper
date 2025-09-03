// src/components/TableActions.tsx
'use client';

import React from 'react';
import { Button, Popconfirm, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface TableActionButtonsProps<T> {
  record: T;
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
}

export default function TableActionButtons<T>({
  record,
  onEdit,
  onDelete,
}: TableActionButtonsProps<T>) {
  return (
    <Space>
      {onEdit && <Button type='link' onClick={() => onEdit(record)} icon={<EditOutlined />} />}
      {onDelete && (
        <Popconfirm
          title='Excluir'
          description='Tem certeza que deseja excluir este item?'
          okText='Sim'
          cancelText='Não'
          onConfirm={() => onDelete?.(record)} // <- só executa aqui
        >
          <Button type='link' danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )}
    </Space>
  );
}
