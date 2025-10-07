'use client';

/**
 * Página de gestão de Escalas
 *
 * Combina tabela, formulário modal e drawer de alocações para permitir o
 * cadastro completo das escalas, desde a definição do ciclo até a atribuição
 * de eletricistas.
 */

import { useEffect, useMemo, useState } from 'react';
import { App, Button, Card, Form, Modal, Spin, Table } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { listEscalas } from '@/lib/actions/escala/list';
import { createEscala } from '@/lib/actions/escala/create';
import { updateEscala } from '@/lib/actions/escala/update';
import { deleteEscala } from '@/lib/actions/escala/delete';
import { getEscala } from '@/lib/actions/escala/get';
import { assignEscala } from '@/lib/actions/escala/assign';
import { generateAgendaEscala } from '@/lib/actions/escala/agenda';
import { listContratos } from '@/lib/actions/contrato/list';
import { listEletricistas } from '@/lib/actions/eletricista/list';
import { EscalaWithRelations } from '@/lib/repositories/EscalaRepository';
import { EscalaAgenda } from '@/lib/services/EscalaService';
import { EscalaFormValues, EscalaFormSubmitPayload } from './components/EscalaForm';
import EscalaForm from './components/EscalaForm';
import EscalaAlocacaoDrawer from './components/EscalaAlocacaoDrawer';
import type { ColumnsType } from 'antd/es/table';

interface ContratoOption {
  id: number;
  nome: string;
}

interface EletricistaOption {
  id: number;
  nome: string;
  matricula: string;
}

export default function EscalaPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<EscalaFormValues>();

  const crudController = useCrudController<EscalaWithRelations>('escalas');

  const escalas = useEntityData<EscalaWithRelations>({
    key: 'escalas',
    fetcher: unwrapFetcher(listEscalas),
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: { contrato: true },
    },
  });

  const [contratos, setContratos] = useState<ContratoOption[]>([]);
  const [loadingContratos, setLoadingContratos] = useState(false);
  const [eletricistas, setEletricistas] = useState<EletricistaOption[]>([]);
  const [eletricistasLoading, setEletricistasLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEscala, setSelectedEscala] = useState<EscalaWithRelations | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [agenda, setAgenda] = useState<EscalaAgenda | null>(null);
  const [agendaLoading, setAgendaLoading] = useState(false);

  useEffect(() => {
    const fetchContratos = async () => {
      setLoadingContratos(true);
      try {
        const result = await listContratos({ page: 1, pageSize: 100, orderBy: 'nome', orderDir: 'asc' });
        if (!result.success || !result.data) {
          message.error(result.error ?? 'Não foi possível listar contratos.');
          return;
        }
        setContratos(result.data.data);
      } catch (error) {
        console.error('Erro ao buscar contratos', error);
        message.error('Erro inesperado ao carregar contratos.');
      } finally {
        setLoadingContratos(false);
      }
    };

    fetchContratos();
  }, [message]);

  const handleSubmitForm = async (values: EscalaFormSubmitPayload) => {
    const action = async () => {
      if (crudController.editingItem) {
        return updateEscala({ ...values, id: crudController.editingItem.id });
      }
      return createEscala(values);
    };

    await crudController.exec(
      action,
      crudController.editingItem ? 'Escala atualizada com sucesso!' : 'Escala criada com sucesso!',
      () => {
        escalas.mutate();
      }
    );
  };

  const handleDelete = async (record: EscalaWithRelations) => {
    await crudController.exec(
      () => deleteEscala({ id: record.id }),
      'Escala removida com sucesso!',
      () => {
        escalas.mutate();
      }
    );
  };

  const fetchEletricistas = async (contratoId: number) => {
    setEletricistasLoading(true);
    try {
      const result = await listEletricistas({
        page: 1,
        pageSize: 200,
        orderBy: 'nome',
        orderDir: 'asc',
        contratoId,
      });
      if (!result.success || !result.data) {
        message.error(result.error ?? 'Falha ao listar eletricistas.');
        return;
      }
      const data = Array.isArray(result.data)
        ? result.data
        : result.data.data;
      setEletricistas(
        data.map(eletricista => ({
          id: eletricista.id,
          nome: eletricista.nome,
          matricula: eletricista.matricula ?? '',
        }))
      );
    } catch (error) {
      console.error('Erro ao buscar eletricistas', error);
      message.error('Erro inesperado ao carregar eletricistas.');
    } finally {
      setEletricistasLoading(false);
    }
  };

  const openDrawer = async (record: EscalaWithRelations) => {
    setDrawerLoading(true);
    try {
      const result = await getEscala({ id: record.id });
      if (!result.success || !result.data) {
        message.error(result.error ?? 'Não foi possível carregar a escala.');
        return;
      }
      setSelectedEscala(result.data);
      setDrawerOpen(true);
      setAgenda(null);
      await fetchEletricistas(result.data.contratoId);
    } catch (error) {
      console.error('Erro ao abrir drawer de escala', error);
      message.error('Erro inesperado ao carregar a escala.');
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleAssign = async (
    escalaId: number,
    horarioId: number,
    allocations: Array<{
      eletricistaId: number;
      ordemRotacao: number;
      vigenciaInicio?: string | null;
      vigenciaFim?: string | null;
      ativo: boolean;
    }>
  ) => {
    try {
      const result = await assignEscala({
        escalaId,
        alocacoes: allocations.map(item => ({
          horarioId,
          eletricistaId: item.eletricistaId,
          ordemRotacao: item.ordemRotacao,
          vigenciaInicio: item.vigenciaInicio ?? undefined,
          vigenciaFim: item.vigenciaFim ?? undefined,
          ativo: item.ativo,
        })),
      });

      if (!result.success || !result.data) {
        message.error(result.error ?? 'Falha ao atualizar alocações.');
        return;
      }

      setSelectedEscala(result.data as EscalaWithRelations);
      escalas.mutate();
      message.success('Alocações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atribuir eletricistas', error);
      message.error('Erro inesperado ao atualizar alocações.');
    }
  };

  const handleGenerateAgenda = async (range: { dataInicio?: string; dataFim?: string }) => {
    if (!selectedEscala) {
      return;
    }
    setAgendaLoading(true);
    try {
      const result = await generateAgendaEscala({
        id: selectedEscala.id,
        dataInicio: range.dataInicio,
        dataFim: range.dataFim,
      });
      if (!result.success || !result.data) {
        message.error(result.error ?? 'Não foi possível gerar agenda.');
        return;
      }
      setAgenda(result.data as EscalaAgenda);
    } catch (error) {
      console.error('Erro ao gerar agenda', error);
      message.error('Erro inesperado ao gerar agenda.');
    } finally {
      setAgendaLoading(false);
    }
  };

  const baseColumns = useMemo<ColumnsType<EscalaWithRelations>>(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 80,
        sorter: true,
      },
      {
        title: 'Nome',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
      },
      {
        title: 'Contrato',
        dataIndex: ['contrato', 'nome'],
        key: 'contrato',
      },
      {
        title: 'Tipo de veículo',
        dataIndex: 'tipoVeiculo',
        key: 'tipoVeiculo',
        render: value => value ?? '—',
      },
      {
        title: 'Ativa',
        dataIndex: 'ativo',
        key: 'ativo',
        render: value => (value ? 'Sim' : 'Não'),
      },
    ],
    []
  );

  const columns = useTableColumnsWithActions(baseColumns, {
    onEdit: record => {
      crudController.open(record);
    },
    onDelete: async record => {
      await handleDelete(record);
    },
    customActions: [
      {
        key: 'alocacoes',
        label: 'Alocações',
        type: 'link',
        onClick: record => openDrawer(record),
      },
    ],
  });

  return (
    <Card
      title='Gestão de Escalas'
      extra={
        <Button type='primary' icon={<PlusOutlined />} onClick={() => crudController.open()}>
          Nova escala
        </Button>
      }
    >
      <Table
        rowKey='id'
        columns={columns}
        dataSource={escalas.data}
        loading={escalas.isLoading}
        pagination={escalas.pagination}
        onChange={escalas.handleTableChange}
      />

      <Modal
        open={crudController.isOpen}
        onCancel={() => crudController.close()}
        onOk={() => form.submit()}
        okButtonProps={{ loading: crudController.loading }}
        title={crudController.editingItem ? 'Editar escala' : 'Nova escala'}
        destroyOnClose
        width={960}
      >
        <Spin spinning={loadingContratos}>
          <EscalaForm
            form={form}
            initialData={crudController.editingItem ?? undefined}
            contratos={contratos}
            loading={crudController.loading}
            onSubmit={async values => {
              await handleSubmitForm(values);
            }}
          />
        </Spin>
      </Modal>

      <Spin spinning={drawerLoading}>
        <EscalaAlocacaoDrawer
          open={drawerOpen}
          escala={selectedEscala}
          eletricistas={eletricistas}
          eletricistasLoading={eletricistasLoading}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedEscala(null);
          }}
          onAssign={handleAssign}
          agenda={agenda}
          agendaLoading={agendaLoading}
          onGenerateAgenda={handleGenerateAgenda}
        />
      </Spin>
    </Card>
  );
}

