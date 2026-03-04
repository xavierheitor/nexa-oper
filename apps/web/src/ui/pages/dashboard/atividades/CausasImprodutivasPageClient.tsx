'use client';

import { FileExcelOutlined } from '@ant-design/icons';
import { createCausaImprodutiva } from '@/lib/actions/causaImprodutiva/create';
import { deleteCausaImprodutiva } from '@/lib/actions/causaImprodutiva/delete';
import { listCausasImprodutivas } from '@/lib/actions/causaImprodutiva/list';
import { updateCausaImprodutiva } from '@/lib/actions/causaImprodutiva/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapPaginatedFetcher } from '@/lib/db/helpers/unwrapPaginatedFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import type { PaginatedResult } from '@/lib/types/common';
import { getLastMonthDateRange } from '@/lib/utils/dateHelpers';
import { getTextFilter } from '@/ui/components/tableFilters';
import { App, Button, DatePicker, Space, Tag, Typography } from 'antd';
import CausaImprodutivaForm from '@/ui/pages/dashboard/atividades/causas-improdutivas/form';
import { CausaImprodutiva } from '@nexa-oper/db';
import dayjs from 'dayjs';
import { useState } from 'react';
import { downloadCsvAsExcelFile, fetchAllPaginatedRows } from './exportUtils';

interface CausasImprodutivasPageClientProps {
  initialData?: PaginatedResult<CausaImprodutiva>;
}

const { RangePicker } = DatePicker;
const defaultRangeDates = getLastMonthDateRange();

export default function CausasImprodutivasPageClient({
  initialData,
}: CausasImprodutivasPageClientProps) {
  const { message } = App.useApp();
  const [isExporting, setIsExporting] = useState(false);
  const controller = useCrudController<CausaImprodutiva>('causas-improdutivas');
  const fetchCausasImprodutivas = unwrapPaginatedFetcher<CausaImprodutiva>(
    listCausasImprodutivas
  );

  const causas = useEntityData<CausaImprodutiva>({
    key: 'causas-improdutivas',
    fetcherAction: fetchCausasImprodutivas,
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      dataInicio: defaultRangeDates.inicio,
      dataFim: defaultRangeDates.fim,
    },
  });

  const handleExportarExcel = async () => {
    try {
      setIsExporting(true);
      const registros = await fetchAllPaginatedRows(
        fetchCausasImprodutivas,
        causas.params
      );

      const headers = ['ID', 'Causa', 'Ativo', 'Criado em'];
      const rows = registros.map((item) => [
        item.id,
        item.causa,
        item.ativo ? 'Ativo' : 'Inativo',
        dayjs(item.createdAt).format('DD/MM/YYYY HH:mm'),
      ]);

      downloadCsvAsExcelFile('causas_improdutivas', headers, rows);
    } catch (error) {
      console.error(error);
      message.error('Falha ao exportar relatório.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createCausaImprodutiva,
    updateAction: updateCausaImprodutiva,
    onSuccess: () => causas.mutate(),
    successMessage: 'Causa improdutiva salva com sucesso!',
  });

  const columns = useTableColumnsWithActions<CausaImprodutiva>(
    [
      { title: 'ID', dataIndex: 'id', key: 'id', sorter: true, width: 80 },
      {
        title: 'Causa',
        dataIndex: 'causa',
        key: 'causa',
        sorter: true,
        ...getTextFilter<CausaImprodutiva>('causa', 'causa'),
      },
      {
        title: 'Ativo',
        dataIndex: 'ativo',
        key: 'ativo',
        width: 100,
        render: (ativo: boolean) =>
          ativo ? <Tag color='success'>Ativo</Tag> : <Tag>Inativo</Tag>,
      },
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        width: 120,
        render: (date: Date | string) =>
          new Date(date).toLocaleDateString('pt-BR'),
      },
    ],
    {
      onEdit: controller.open,
      onDelete: (item) =>
        controller
          .exec(
            () => deleteCausaImprodutiva({ id: item.id }),
            'Causa improdutiva excluída com sucesso!'
          )
          .finally(() => causas.mutate()),
    }
  );

  return (
    <CrudPage
      title='Causas Improdutivas'
      entityKey='causas-improdutivas'
      controller={controller}
      entityData={causas}
      columns={columns}
      formComponent={CausaImprodutivaForm}
      onSubmit={handleSubmit}
      addButtonText='Nova Causa'
      tableHeaderContent={
        <Space
          style={{
            marginBottom: 12,
            width: '100%',
            justifyContent: 'space-between',
          }}
          wrap
        >
          <Space wrap>
            <Typography.Text type='secondary'>Período de criação:</Typography.Text>
            <RangePicker
              allowClear
              format='DD/MM/YYYY'
              defaultValue={[
                dayjs(defaultRangeDates.inicio),
                dayjs(defaultRangeDates.fim),
              ]}
              onChange={(range) =>
                causas.setParams((prev) => ({
                  ...prev,
                  dataInicio: range?.[0]
                    ? dayjs(range[0]).toDate()
                    : undefined,
                  dataFim: range?.[1] ? dayjs(range[1]).toDate() : undefined,
                  page: 1,
                }))
              }
            />
          </Space>

          <Button
            icon={<FileExcelOutlined />}
            loading={isExporting}
            onClick={handleExportarExcel}
          >
            Exportar Excel
          </Button>
        </Space>
      }
    />
  );
}
