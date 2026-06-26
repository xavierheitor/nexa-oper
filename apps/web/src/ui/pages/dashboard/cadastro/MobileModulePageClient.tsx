'use client';

import { createMobileModule } from '@/lib/actions/mobileModule/create';
import { deleteMobileModule } from '@/lib/actions/mobileModule/delete';
import { listMobileModules } from '@/lib/actions/mobileModule/list';
import { updateMobileModule } from '@/lib/actions/mobileModule/update';
import CrudPage from '@/lib/components/CrudPage';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useCrudController } from '@/lib/hooks/useCrudController';
import { useCrudFormHandler } from '@/lib/hooks/useCrudFormHandler';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { PaginatedResult } from '@/lib/types/common';
import MobileModuleForm from '@/ui/pages/dashboard/cadastro/mobile-module/form';
import type { MobileModule } from '@nexa-oper/db';
import { Tag } from 'antd';

interface Props {
  initialData?: PaginatedResult<MobileModule>;
}

export default function MobileModulePageClient({ initialData }: Props) {
  const controller = useCrudController<MobileModule>('mobile-modules');
  const modules = useEntityData<MobileModule>({
    key: 'mobile-modules',
    fetcherAction: unwrapFetcher(listMobileModules),
    paginationEnabled: true,
    initialData,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'ordem',
      orderDir: 'asc',
    },
  });
  const handleSubmit = useCrudFormHandler({
    controller,
    createAction: createMobileModule,
    updateAction: updateMobileModule,
    onSuccess: () => modules.mutate(),
    successMessage: 'Módulo mobile salvo com sucesso!',
  });
  const columns = useTableColumnsWithActions<MobileModule>(
    [
      { title: 'Ordem', dataIndex: 'ordem', key: 'ordem', width: 90 },
      { title: 'Nome', dataIndex: 'nome', key: 'nome' },
      { title: 'Chave', dataIndex: 'key', key: 'key' },
      {
        title: 'Status',
        dataIndex: 'ativo',
        key: 'ativo',
        width: 100,
        render: (ativo: boolean) => (
          <Tag color={ativo ? 'green' : 'default'}>
            {ativo ? 'Ativo' : 'Inativo'}
          </Tag>
        ),
      },
    ],
    {
      onEdit: controller.open,
      onDelete: item =>
        controller
          .exec(
            () => deleteMobileModule({ id: item.id }),
            'Módulo mobile removido com sucesso!'
          )
          .finally(() => modules.mutate()),
    }
  );

  return (
    <CrudPage
      title='Módulos do App Mobile'
      entityKey='mobile-modules'
      controller={controller}
      entityData={modules}
      columns={columns}
      formComponent={MobileModuleForm}
      onSubmit={handleSubmit}
    />
  );
}
