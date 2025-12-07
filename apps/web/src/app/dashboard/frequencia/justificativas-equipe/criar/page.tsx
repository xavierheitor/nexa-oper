'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Select, DatePicker, Input, Button, message, Alert } from 'antd';
import { useRouter } from 'next/navigation';
import { createJustificativaEquipe } from '@/lib/actions/justificativa-equipe/create';
import { listAllTiposJustificativa } from '@/lib/actions/tipo-justificativa/list';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { listEquipes } from '@/lib/actions/equipe/list';
import dayjs from 'dayjs';

/**
 * Página para criar justificativa de equipe
 */
export default function CriarJustificativaEquipePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [casoId, setCasoId] = useState<string | null>(null);
  const [equipeIdParam, setEquipeIdParam] = useState<string | null>(null);
  const [dataReferenciaParam, setDataReferenciaParam] = useState<string | null>(null);

  // Ler parâmetros da URL no cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setCasoId(params.get('casoId'));
      setEquipeIdParam(params.get('equipeId'));
      setDataReferenciaParam(params.get('dataReferencia'));
    }
  }, []);

  const { data: tipos } = useDataFetch(async () => {
    const result = await listAllTiposJustificativa(true);
    if (result.success) {
      return result.data;
    }
    return [];
  }, []);

  const { data: equipesData } = useDataFetch(async () => {
    const result = await listEquipes({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    });
    if (result.success && result.data) {
      return result.data.data || result.data.items || [];
    }
    return [];
  }, []);

  // Pré-preencher formulário se vier de caso pendente
  useEffect(() => {
    if (casoId && equipeIdParam && dataReferenciaParam) {
      form.setFieldsValue({
        equipeId: parseInt(equipeIdParam, 10),
        dataReferencia: dayjs(dataReferenciaParam),
      });
    }
  }, [casoId, equipeIdParam, dataReferenciaParam, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Se vier de caso pendente, usar endpoint especial que vincula ao caso
      if (casoId) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${baseUrl}/api/justificativas-equipe/casos/${casoId}/justificar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            tipoJustificativaId: values.tipoJustificativaId,
            descricao: values.descricao,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro ao criar justificativa: ${response.statusText} - ${errorText}`);
        }

        message.success('Justificativa criada com sucesso');
        router.push('/dashboard/frequencia/justificativas-equipe');
      } else {
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
      }
    } catch (error: any) {
      message.error(error.message || 'Erro ao criar justificativa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Criar Justificativa de Equipe">
      {casoId && (
        <Alert
          message="Criando justificativa a partir de caso pendente"
          description="Esta justificativa será vinculada ao caso pendente e marcará o caso como justificado."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
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
          <Select
            placeholder="Selecione a equipe"
            disabled={!!casoId}
          >
            {equipesData?.map((equipe: any) => (
              <Select.Option key={equipe.id} value={equipe.id}>
                {equipe.nome}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Data"
          name="dataReferencia"
          rules={[{ required: true, message: 'Selecione a data' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            disabled={!!casoId}
          />
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

