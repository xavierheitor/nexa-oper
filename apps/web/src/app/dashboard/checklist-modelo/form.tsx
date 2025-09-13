'use client';

import { Button, Card, Form, Input, Select, Spin, Transfer, Typography, message } from 'antd';
import type { TransferItem } from 'antd/es/transfer';
import { useEffect, useMemo, useState } from 'react';

import { getChecklist } from '@/lib/actions/checklist/get';
import { listChecklistOpcoesResposta } from '@/lib/actions/checklistOpcaoResposta/list';
import { listChecklistPerguntas } from '@/lib/actions/checklistPergunta/list';
import { listTiposChecklist } from '@/lib/actions/tipoChecklist/list';

import type { ChecklistOpcaoResposta, ChecklistPergunta, TipoChecklist } from '@nexa-oper/db';

const { Title } = Typography;

export interface ChecklistFormData {
  nome: string;
  tipoChecklistId: number;
  perguntaIds: number[];
  opcaoRespostaIds: number[];
}

interface Props {
  onSubmit: (values: ChecklistFormData) => void;
  initialValues?: Partial<ChecklistFormData & { id: number }>;
  loading?: boolean;
}

export default function ChecklistForm({ onSubmit, initialValues, loading = false }: Props) {
  const [form] = Form.useForm<ChecklistFormData>();
  const [tipos, setTipos] = useState<TipoChecklist[]>([]);
  const [perguntas, setPerguntas] = useState<ChecklistPergunta[]>([]);
  const [opcoes, setOpcoes] = useState<ChecklistOpcaoResposta[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  const [targetPerguntas, setTargetPerguntas] = useState<string[]>([]);
  const [targetOpcoes, setTargetOpcoes] = useState<string[]>([]);

  const perguntaItems = useMemo<TransferItem[]>(
    () => perguntas.map(p => ({ key: String(p.id), title: p.nome })),
    [perguntas]
  );
  const opcaoItems = useMemo<TransferItem[]>(
    () => opcoes.map(o => ({ key: String(o.id), title: o.nome })),
    [opcoes]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingSources(true);
        const [tiposRes, perguntasRes, opcoesRes] = await Promise.all([
          listTiposChecklist({ page: 1, pageSize: 100, orderBy: 'nome', orderDir: 'asc' }),
          listChecklistPerguntas({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
          listChecklistOpcoesResposta({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
        ]);
        setTipos(tiposRes.data?.data || []);
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

  useEffect(() => {
    const applyInitial = async () => {
      if (initialValues) {
        form.setFieldsValue({
          nome: initialValues.nome as any,
          tipoChecklistId: initialValues.tipoChecklistId as any,
          perguntaIds: (initialValues.perguntaIds || []) as any,
          opcaoRespostaIds: (initialValues.opcaoRespostaIds || []) as any,
        });

        if ((initialValues as any).id) {
          const res = await getChecklist({ id: (initialValues as any).id });
          const data = res.data as any;
          if (data) {
            setTargetPerguntas((data.ChecklistPerguntaRelacao || []).map((r: any) => String(r.checklistPerguntaId)));
            setTargetOpcoes((data.ChecklistOpcaoRespostaRelacao || []).map((r: any) => String(r.checklistOpcaoRespostaId)));
          }
        } else {
          setTargetPerguntas((initialValues.perguntaIds || []).map(String));
          setTargetOpcoes((initialValues.opcaoRespostaIds || []).map(String));
        }
      } else {
        form.resetFields();
        setTargetPerguntas([]);
        setTargetOpcoes([]);
      }
    };
    applyInitial();
  }, [initialValues, form]);

  if (loading) return <Spin spinning />;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(vals) =>
        onSubmit({
          nome: vals.nome,
          tipoChecklistId: vals.tipoChecklistId,
          perguntaIds: targetPerguntas.map(Number),
          opcaoRespostaIds: targetOpcoes.map(Number),
        })
      }
    >
      <Title level={5}>Dados do Checklist</Title>
      <Form.Item name="nome" label="Nome" rules={[{ required: true }, { min: 1, max: 255 }]}>
        <Input placeholder="Digite o nome do checklist" />
      </Form.Item>

      <Form.Item name="tipoChecklistId" label="Tipo" rules={[{ required: true }]}>
        <Select
          placeholder="Selecione o tipo do checklist"
          loading={loadingSources}
          options={tipos.map(t => ({ value: t.id, label: t.nome }))}
          showSearch
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        />
      </Form.Item>

      <Card size="small" title="Perguntas" style={{ marginTop: 12 }}>
        <Transfer
          dataSource={perguntaItems}
          targetKeys={targetPerguntas}
          onChange={(nextTarget) => setTargetPerguntas(nextTarget.map(String))}
          render={item => item.title as string}
          listStyle={{ width: '48%', height: 300 }}
          titles={["Disponíveis", "Selecionadas"]}
        />
      </Card>

      <Card size="small" title="Opções de Resposta" style={{ marginTop: 12 }}>
        <Transfer
          dataSource={opcaoItems}
          targetKeys={targetOpcoes}
          onChange={(nextTarget) => setTargetOpcoes(nextTarget.map(String))}
          render={item => item.title as string}
          listStyle={{ width: '48%', height: 300 }}
          titles={["Disponíveis", "Selecionadas"]}
        />
      </Card>

      <Form.Item style={{ marginTop: 16 }}>
        <Button type="primary" htmlType="submit" block loading={loading || loadingSources}>
          Salvar
        </Button>
      </Form.Item>
    </Form>
  );
}

