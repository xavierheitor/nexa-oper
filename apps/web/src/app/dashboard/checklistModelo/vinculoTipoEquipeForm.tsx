'use client';

import { Button, Form, Select } from 'antd';
import { useEffect, useState } from 'react';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import { listChecklists } from '@/lib/actions/checklist/list';

export interface VinculoTEFormData {
  tipoEquipeId: number;
  checklistId: number;
}

export default function VinculoTipoEquipeForm({ onSubmit, loading = false }: { onSubmit: (v: VinculoTEFormData) => void; loading?: boolean }) {
  const [form] = Form.useForm<VinculoTEFormData>();
  const [tipos, setTipos] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [tv, cl] = await Promise.all([
        listTiposEquipe({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
        listChecklists({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
      ]);
      setTipos(tv.data?.data || []);
      setChecklists(cl.data?.data || []);
    })();
  }, []);

  return (
    <Form form={form} layout="vertical" onFinish={onSubmit as any}>
      <Form.Item name="tipoEquipeId" label="Tipo de Equipe" rules={[{ required: true }]}>
        <Select showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} options={tipos.map(t => ({ value: t.id, label: t.nome }))} />
      </Form.Item>
      <Form.Item name="checklistId" label="Checklist" rules={[{ required: true }]}>
        <Select showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} options={checklists.map(c => ({ value: c.id, label: c.nome }))} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>Salvar</Button>
      </Form.Item>
    </Form>
  );
}

