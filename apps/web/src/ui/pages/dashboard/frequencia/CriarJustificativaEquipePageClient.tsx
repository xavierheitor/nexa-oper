'use client';

import { useEffect, useState } from 'react';
import { Card, Form, Select, DatePicker, Input, Button, message, Alert } from 'antd';
import { useRouter } from 'next/navigation';
import { createJustificativaEquipe } from '@/lib/actions/justificativa-equipe/create';
import { listAllTiposJustificativa } from '@/lib/actions/tipo-justificativa/list';
import { listEquipes } from '@/lib/actions/equipe/list';
import dayjs, { type Dayjs } from 'dayjs';
import useSWR from 'swr';

interface TipoJustificativaOption {
  id: number;
  nome: string;
  geraFalta?: boolean;
}

interface EquipeOption {
  id: number;
  nome: string;
}

interface CriarJustificativaEquipePageClientProps {
  initialTipos?: TipoJustificativaOption[];
  initialEquipes?: EquipeOption[];
  initialCasoId?: number;
  initialEquipeId?: number;
  initialDataReferenciaIso?: string;
}

interface FormValues {
  equipeId: number;
  dataReferencia: Dayjs;
  tipoJustificativaId: number;
  descricao?: string;
}

export default function CriarJustificativaEquipePageClient({
  initialTipos = [],
  initialEquipes = [],
  initialCasoId,
  initialEquipeId,
  initialDataReferenciaIso,
}: CriarJustificativaEquipePageClientProps) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const casoId = initialCasoId;

  const tiposFetcher = async (): Promise<TipoJustificativaOption[]> => {
    const result = await listAllTiposJustificativa(true);
    if (!result.success) {
      return [];
    }
    return (result.data as TipoJustificativaOption[]) ?? [];
  };

  const equipesFetcher = async (): Promise<EquipeOption[]> => {
    const result = await listEquipes({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    });
    if (!result.success) {
      return [];
    }

    const rows = (result.data as { data?: EquipeOption[] } | undefined)?.data;
    return Array.isArray(rows) ? rows : [];
  };

  const { data: tipos = [] } = useSWR(
    'tipos-justificativa-all-ativo',
    tiposFetcher,
    {
      fallbackData: initialTipos,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const { data: equipesData = [] } = useSWR(
    'equipes-justificativa-create',
    equipesFetcher,
    {
      fallbackData: initialEquipes,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (casoId && initialEquipeId && initialDataReferenciaIso) {
      form.setFieldsValue({
        equipeId: initialEquipeId,
        dataReferencia: dayjs(initialDataReferenciaIso),
      });
    }
  }, [casoId, initialEquipeId, initialDataReferenciaIso, form]);

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (casoId) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        const endpoint = baseUrl
          ? `${baseUrl}/api/justificativas-equipe/casos/${casoId}/justificar`
          : `/api/justificativas-equipe/casos/${casoId}/justificar`;

        const response = await fetch(endpoint, {
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
          throw new Error(
            `Erro ao criar justificativa: ${response.statusText} - ${errorText}`
          );
        }

        message.success('Justificativa criada com sucesso');
        router.push('/dashboard/frequencia/justificativas-equipe');
        return;
      }

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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao criar justificativa';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title='Criar Justificativa de Equipe'>
      {casoId && (
        <Alert
          message='Criando justificativa a partir de caso pendente'
          description='Esta justificativa sera vinculada ao caso pendente e marcara o caso como justificado.'
          type='info'
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Form
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        style={{ maxWidth: 600 }}
      >
        <Form.Item
          label='Equipe'
          name='equipeId'
          rules={[{ required: true, message: 'Selecione a equipe' }]}
        >
          <Select
            placeholder='Selecione a equipe'
            disabled={Boolean(casoId)}
            options={equipesData.map((equipe) => ({
              value: equipe.id,
              label: equipe.nome,
            }))}
          />
        </Form.Item>

        <Form.Item
          label='Data'
          name='dataReferencia'
          rules={[{ required: true, message: 'Selecione a data' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format='DD/MM/YYYY'
            disabled={Boolean(casoId)}
          />
        </Form.Item>

        <Form.Item
          label='Tipo de Justificativa'
          name='tipoJustificativaId'
          rules={[{ required: true, message: 'Selecione o tipo' }]}
        >
          <Select
            placeholder='Selecione o tipo'
            options={tipos.map((tipo) => ({
              value: tipo.id,
              label: `${tipo.nome}${tipo.geraFalta ? '' : ' (Nao gera falta)'}`,
            }))}
          />
        </Form.Item>

        <Form.Item label='Descricao' name='descricao'>
          <Input.TextArea rows={4} placeholder='Descreva o motivo...' />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' loading={loading}>
            Criar Justificativa
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
