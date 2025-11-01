'use client';

import { createChecklist } from '@/lib/actions/checklist/create';
import { deleteChecklist } from '@/lib/actions/checklist/delete';
import { getChecklist } from '@/lib/actions/checklist/get';
import { listChecklists } from '@/lib/actions/checklist/list';
import { updateChecklist } from '@/lib/actions/checklist/update';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { ActionResult } from '@/lib/types/common';
import { getTextFilter } from '@/ui/components/tableFilters';
import { Checklist } from '@nexa-oper/db';
import { Button, Card, Modal, Table, Form, Select, Spin, App, message } from 'antd';
import { useEffect, useState } from 'react';
import ChecklistForm, { ChecklistFormData } from './form';
import { listChecklistTipoVeiculoVinculos } from '@/lib/actions/checklistVinculo/tipoVeiculo/list';
import { setChecklistTipoVeiculo } from '@/lib/actions/checklistVinculo/tipoVeiculo/set';
import { deleteChecklistTipoVeiculoVinculo } from '@/lib/actions/checklistVinculo/tipoVeiculo/delete';
import { listChecklistTipoEquipeVinculos } from '@/lib/actions/checklistVinculo/tipoEquipe/list';
import { setChecklistTipoEquipe } from '@/lib/actions/checklistVinculo/tipoEquipe/set';
import { deleteChecklistTipoEquipeVinculo } from '@/lib/actions/checklistVinculo/tipoEquipe/delete';
import { listTiposVeiculo } from '@/lib/actions/tipoVeiculo/list';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';

export default function ChecklistPage() {
  const { message } = App.useApp();
  const controller = useCrudController<Checklist>('checklists');
  const tvController = useCrudController<any>('checklist-tv-vinculos');
  const teController = useCrudController<any>('checklist-te-vinculos');

  const checklists = useEntityData<Checklist>({
    key: 'checklists',
    fetcherAction: unwrapFetcher(listChecklists),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        tipoChecklist: true,
        ChecklistPerguntaRelacao: true,
        ChecklistOpcaoRespostaRelacao: true,
      },
    },
  });

  const tvVinculos = useEntityData<any>({
    key: 'checklist-tv-vinculos',
    fetcherAction: unwrapFetcher(listChecklistTipoVeiculoVinculos),
    paginationEnabled: true,
    initialParams: { page: 1, pageSize: 10, orderBy: 'id', orderDir: 'desc', include: { tipoVeiculo: true, checklist: true } },
  });

  const teVinculos = useEntityData<any>({
    key: 'checklist-te-vinculos',
    fetcherAction: unwrapFetcher(listChecklistTipoEquipeVinculos),
    paginationEnabled: true,
    initialParams: { page: 1, pageSize: 10, orderBy: 'id', orderDir: 'desc', include: { tipoEquipe: true, checklist: true } },
  });

  const columns = useTableColumnsWithActions<Checklist>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      { title: 'Nome', dataIndex: 'nome', key: 'nome', sorter: true, ...getTextFilter<Checklist>('nome', 'nome') },
      { title: 'Tipo', dataIndex: ['tipoChecklist', 'nome'], key: 'tipoChecklist' },
      { title: 'Perguntas', key: 'perguntas', render: (_, r: any) => (r.ChecklistPerguntaRelacao || []).length, width: 120 },
      { title: 'Opções', key: 'opcoes', render: (_, r: any) => (r.ChecklistOpcaoRespostaRelacao || []).length, width: 120 },
      { title: 'Criado em', dataIndex: 'createdAt', key: 'createdAt', sorter: true, render: (d: Date) => new Date(d).toLocaleDateString('pt-BR'), width: 120 },
    ],
    {
      onEdit: async (item) => {
        const res = await getChecklist({ id: (item as any).id });
        controller.open(res.data as any);
      },
      onDelete: (item) =>
        controller
          .exec(() => deleteChecklist({ id: (item as any).id }), 'Checklist excluído com sucesso!')
          .finally(() => checklists.mutate()),
    }
  );

  const tvColumns = useTableColumnsWithActions<any>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
      { title: 'Tipo de Veículo', dataIndex: ['tipoVeiculo', 'nome'], key: 'tipoVeiculo' },
      { title: 'Checklist', dataIndex: ['checklist', 'nome'], key: 'checklist' },
      { title: 'Criado em', dataIndex: 'createdAt', key: 'createdAt', render: (d: Date) => new Date(d).toLocaleDateString('pt-BR'), width: 120 },
    ],
    {
      onDelete: (item) => tvController.exec(() => deleteChecklistTipoVeiculoVinculo({ id: item.id }), 'Vínculo removido!').finally(() => tvVinculos.mutate()),
    }
  );

  const teColumns = useTableColumnsWithActions<any>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
      { title: 'Tipo de Equipe', dataIndex: ['tipoEquipe', 'nome'], key: 'tipoEquipe' },
      { title: 'Checklist', dataIndex: ['checklist', 'nome'], key: 'checklist' },
      { title: 'Criado em', dataIndex: 'createdAt', key: 'createdAt', render: (d: Date) => new Date(d).toLocaleDateString('pt-BR'), width: 120 },
    ],
    {
      onDelete: (item) => teController.exec(() => deleteChecklistTipoEquipeVinculo({ id: item.id }), 'Vínculo removido!').finally(() => teVinculos.mutate()),
    }
  );

  const handleSubmit = async (values: ChecklistFormData) => {
    const action = async (): Promise<ActionResult<Checklist>> => {
      const result = controller.editingItem?.id
        ? await updateChecklist({ ...values, id: controller.editingItem.id })
        : await createChecklist(values);
      return result;
    };
    controller.exec(action, 'Checklist salvo com sucesso!').finally(() => checklists.mutate());
  };

  if (checklists.error) return <p style={{ color: 'red' }}>Erro ao carregar checklists.</p>;
  if (tvVinculos.error) return <p style={{ color: 'red' }}>Erro ao carregar vínculos por tipo de veículo.</p>;
  if (teVinculos.error) return <p style={{ color: 'red' }}>Erro ao carregar vínculos por tipo de equipe.</p>;

  return (
    <>
      <Card title="Checklists" extra={<Button type="primary" onClick={() => controller.open()}>Adicionar</Button>}>
        <Table<Checklist>
          columns={columns}
          dataSource={checklists.data}
          loading={checklists.isLoading}
          rowKey="id"
          pagination={checklists.pagination}
          onChange={checklists.handleTableChange}
        />
      </Card>

      <Card title="Vínculos por Tipo de Veículo" style={{ marginTop: 16 }} extra={<Button type="primary" onClick={() => tvController.open()}>Vincular</Button>}>
        <Table columns={tvColumns} dataSource={tvVinculos.data} loading={tvVinculos.isLoading} rowKey="id" pagination={tvVinculos.pagination} onChange={tvVinculos.handleTableChange} />
      </Card>

      <Card title="Vínculos por Tipo de Equipe" style={{ marginTop: 16 }} extra={<Button type="primary" onClick={() => teController.open()}>Vincular</Button>}>
        <Table columns={teColumns} dataSource={teVinculos.data} loading={teVinculos.isLoading} rowKey="id" pagination={teVinculos.pagination} onChange={teVinculos.handleTableChange} />
      </Card>

      <Modal
        title={controller.editingItem ? 'Editar Checklist' : 'Novo Checklist'}
        open={controller.isOpen}
        onCancel={controller.close}
        footer={null}
        destroyOnHidden
        width={800}
      >
        <ChecklistForm initialValues={controller.editingItem as any} onSubmit={handleSubmit} loading={controller.loading} />
      </Modal>

      {/* Modal Vínculo TipoVeiculo */}
      <Modal title="Vincular Checklist a Tipo de Veículo" open={tvController.isOpen} onCancel={tvController.close} footer={null} destroyOnHidden width={600}>
        <VinculoTVModal onSaved={() => tvVinculos.mutate()} controllerExec={tvController.exec} />
      </Modal>

      {/* Modal Vínculo TipoEquipe */}
      <Modal title="Vincular Checklist a Tipo de Equipe" open={teController.isOpen} onCancel={teController.close} footer={null} destroyOnHidden width={600}>
        <VinculoTEModal onSaved={() => teVinculos.mutate()} controllerExec={teController.exec} />
      </Modal>
    </>
  );
}

function VinculoTVModal({ onSaved, controllerExec }: { onSaved: () => void; controllerExec: any }) {
  const [form] = Form.useForm();
  const [tipos, setTipos] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [tv, cl] = await Promise.all([
          listTiposVeiculo({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
          listChecklists({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
        ]);
        setTipos(tv.data?.data || []);
        setChecklists(cl.data?.data || []);
      } catch (e) {
        message.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spin spinning />;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values: any) =>
        controllerExec(
          () => setChecklistTipoVeiculo(values),
          'Vínculo salvo com sucesso!'
        ).finally(onSaved)
      }
    >
      <Form.Item name="tipoVeiculoId" label="Tipo de Veículo" rules={[{ required: true }]}>
        <Select showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} options={tipos.map(t => ({ value: t.id, label: t.nome }))} />
      </Form.Item>
      <Form.Item name="checklistId" label="Checklist" rules={[{ required: true }]}>
        <Select showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} options={checklists.map(c => ({ value: c.id, label: c.nome }))} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Salvar
        </Button>
      </Form.Item>
    </Form>
  );
}

function VinculoTEModal({ onSaved, controllerExec }: { onSaved: () => void; controllerExec: any }) {
  const [form] = Form.useForm();
  const [tipos, setTipos] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [te, cl] = await Promise.all([
          listTiposEquipe({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
          listChecklists({ page: 1, pageSize: 200, orderBy: 'nome', orderDir: 'asc' }),
        ]);
        setTipos(te.data?.data || []);
        setChecklists(cl.data?.data || []);
      } catch (e) {
        message.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Spin spinning />;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values: any) =>
        controllerExec(
          () => setChecklistTipoEquipe(values),
          'Vínculo salvo com sucesso!'
        ).finally(onSaved)
      }
    >
      <Form.Item name="tipoEquipeId" label="Tipo de Equipe" rules={[{ required: true }]}>
        <Select showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} options={tipos.map(t => ({ value: t.id, label: t.nome }))} />
      </Form.Item>
      <Form.Item name="checklistId" label="Checklist" rules={[{ required: true }]}>
        <Select showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} options={checklists.map(c => ({ value: c.id, label: c.nome }))} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Salvar
        </Button>
      </Form.Item>
    </Form>
  );
}
