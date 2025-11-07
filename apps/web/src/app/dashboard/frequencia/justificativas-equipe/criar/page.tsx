'use client';

import { useState } from 'react';
import { Card, Form, Select, DatePicker, Input, Button, message } from 'antd';
import { useRouter } from 'next/navigation';
import { createJustificativaEquipe } from '@/lib/actions/justificativa-equipe/create';
import { listAllTiposJustificativa } from '@/lib/actions/tipo-justificativa/list';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

/**
 * Página para criar justificativa de equipe
 */
export default function CriarJustificativaEquipePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { data: tipos } = useDataFetch(async () => {
    const result = await listAllTiposJustificativa(true);
    if (result.success) {
      return result.data;
    }
    return [];
  }, []);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const result = await createJustificativaEquipe({
        equipeId: values.equipeId,
        dataReferencia: values.dataReferencia.toISOString(),
        tipoJustificativaId: values.tipoJustificativaId,
        descricao: values.descricao,
      });

      if (result.success) {
        message.success('Justificativa criada com sucesso');
        router.push('/dashboard/frequencia/justificativas-equipe');
      } else {
        message.error(result.error || 'Erro ao criar justificativa');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Criar Justificativa de Equipe">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 600 }}
      >
        <Form.Item
          label="Equipe"
          name="equipeId"
          rules={[{ required: true, message: 'Selecione a equipe' }]}
        >
          <Select placeholder="Selecione a equipe">
            {/* TODO: Carregar equipes dinamicamente */}
          </Select>
        </Form.Item>

        <Form.Item
          label="Data"
          name="dataReferencia"
          rules={[{ required: true, message: 'Selecione a data' }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item
          label="Tipo de Justificativa"
          name="tipoJustificativaId"
          rules={[{ required: true, message: 'Selecione o tipo' }]}
        >
          <Select placeholder="Selecione o tipo">
            {tipos?.map((tipo: any) => (
              <Select.Option key={tipo.id} value={tipo.id}>
                {tipo.nome} {!tipo.geraFalta && '(Não gera falta)'}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Descrição" name="descricao">
          <Input.TextArea rows={4} placeholder="Descreva o motivo..." />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Criar Justificativa
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

