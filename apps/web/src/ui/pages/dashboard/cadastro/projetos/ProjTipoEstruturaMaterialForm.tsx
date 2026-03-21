'use client';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ProjTipoConsumoMaterial } from '@nexa-oper/db';
import { Button, Form, InputNumber, Select, Spin, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useRef, useState } from 'react';

export interface ProjTipoEstruturaMaterialItemFormData {
  materialId?: number;
  quantidadeBase?: number;
  tipoConsumo?: ProjTipoConsumoMaterial;
}

export interface ProjTipoEstruturaMaterialFormData {
  tipoEstruturaId?: number;
  itens: ProjTipoEstruturaMaterialItemFormData[];
}

interface TipoEstruturaOption {
  id: number;
  nome: string;
}

interface MaterialOption {
  id: number;
  codigo: string;
  descricao: string;
}

interface Props {
  onSubmit: (values: ProjTipoEstruturaMaterialFormData) => void | Promise<void>;
  initialValues?: Partial<ProjTipoEstruturaMaterialFormData>;
  loading?: boolean;
  tiposEstrutura: TipoEstruturaOption[];
  materiais: MaterialOption[];
}

interface InternalFormData extends ProjTipoEstruturaMaterialFormData {
  draftMaterialId?: number;
  draftQuantidadeBase?: number;
  draftTipoConsumo?: ProjTipoConsumoMaterial;
}

type EditingInitialValues = Partial<ProjTipoEstruturaMaterialFormData> & {
  materialId?: number;
  quantidadeBase?: number;
  tipoConsumo?: ProjTipoConsumoMaterial;
};

type AddedItemRow = ProjTipoEstruturaMaterialItemFormData & {
  key: string;
};

const TIPO_CONSUMO_OPTIONS = [
  { value: 'FIXO' as ProjTipoConsumoMaterial, label: 'Fixo' },
  { value: 'VARIAVEL' as ProjTipoConsumoMaterial, label: 'Variável' },
];

const DEFAULT_TIPO_CONSUMO = 'FIXO' as ProjTipoConsumoMaterial;
const VARIAVEL_FALLBACK_QUANTIDADE_BASE = 0.0001;
const CONSUMO_VARIAVEL_HELPER_TEXT =
  'Consumo variável não exige quantidade padrão.';

const createEmptyItem = (): ProjTipoEstruturaMaterialItemFormData => ({
  tipoConsumo: DEFAULT_TIPO_CONSUMO,
});

const formatQuantidadeBase = (value?: number): string =>
  typeof value === 'number'
    ? value.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      })
    : '-';

const normalizeItemForSubmit = (
  item: ProjTipoEstruturaMaterialItemFormData
): ProjTipoEstruturaMaterialItemFormData => ({
  materialId: item.materialId,
  tipoConsumo: item.tipoConsumo ?? DEFAULT_TIPO_CONSUMO,
  quantidadeBase:
    item.tipoConsumo === 'VARIAVEL'
      ? item.quantidadeBase ?? VARIAVEL_FALLBACK_QUANTIDADE_BASE
      : item.quantidadeBase,
});

export default function ProjTipoEstruturaMaterialForm({
  onSubmit,
  initialValues,
  loading = false,
  tiposEstrutura,
  materiais,
}: Props) {
  const [form] = Form.useForm<InternalFormData>();
  const [items, setItems] = useState<ProjTipoEstruturaMaterialItemFormData[]>([]);
  const shouldValidateDraftRef = useRef(false);
  const editingValues = initialValues as EditingInitialValues | undefined;
  const isEditing = typeof editingValues?.materialId === 'number';
  const draftTipoConsumo = Form.useWatch('draftTipoConsumo', form) ?? DEFAULT_TIPO_CONSUMO;
  const editingTipoConsumo =
    Form.useWatch(['itens', 0, 'tipoConsumo'], form) ?? DEFAULT_TIPO_CONSUMO;

  useEffect(() => {
    if (editingValues) {
      const initialItems =
        typeof editingValues.materialId === 'number'
          ? [
              {
                materialId: editingValues.materialId,
                quantidadeBase: editingValues.quantidadeBase,
                tipoConsumo: editingValues.tipoConsumo ?? DEFAULT_TIPO_CONSUMO,
              },
            ]
          : editingValues.itens?.length
            ? editingValues.itens
            : [];

      setItems(initialItems);
      form.resetFields();
      form.setFieldsValue({
        tipoEstruturaId: editingValues.tipoEstruturaId,
        itens: initialItems.length > 0 ? initialItems : [createEmptyItem()],
        draftMaterialId: undefined,
        draftQuantidadeBase: undefined,
        draftTipoConsumo: DEFAULT_TIPO_CONSUMO,
      });
      return;
    }

    setItems([]);
    form.resetFields();
    form.setFieldsValue({
      itens: [createEmptyItem()],
      draftMaterialId: undefined,
      draftQuantidadeBase: undefined,
      draftTipoConsumo: DEFAULT_TIPO_CONSUMO,
    });
  }, [editingValues, form]);

  const getMaterialLabel = (materialId?: number): string => {
    if (typeof materialId !== 'number') {
      return '-';
    }

    const material = materiais.find((item) => item.id === materialId);
    return material ? `${material.codigo} - ${material.descricao}` : `Material #${materialId}`;
  };

  const resetDraftFields = () => {
    form.setFields([
      { name: 'draftMaterialId', errors: [] },
      { name: 'draftTipoConsumo', errors: [] },
      { name: 'draftQuantidadeBase', errors: [] },
    ]);
    form.setFieldsValue({
      draftMaterialId: undefined,
      draftQuantidadeBase: undefined,
      draftTipoConsumo: DEFAULT_TIPO_CONSUMO,
    });
  };

  const getDraftRequiredRule = (errorMessage: string) => ({
    validator: (_: unknown, value: unknown) => {
      if (!shouldValidateDraftRef.current) {
        return Promise.resolve();
      }

      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error(errorMessage));
      }

      return Promise.resolve();
    },
  });

  const handleAddItem = async () => {
    const fieldsToValidate: Array<keyof InternalFormData> = [
      'draftMaterialId',
      'draftTipoConsumo',
    ];

    if (draftTipoConsumo === 'FIXO') {
      fieldsToValidate.push('draftQuantidadeBase');
    }

    try {
      shouldValidateDraftRef.current = true;
      const values = await form.validateFields(fieldsToValidate);
      const materialId = values.draftMaterialId;

      if (typeof materialId !== 'number') {
        return;
      }

      if (items.some((item) => item.materialId === materialId)) {
        form.setFields([
          {
            name: 'draftMaterialId',
            errors: ['Esse material já foi adicionado para a estrutura.'],
          },
        ]);
        return;
      }

      setItems((currentItems) => [
        ...currentItems,
        {
          materialId,
          tipoConsumo: values.draftTipoConsumo ?? DEFAULT_TIPO_CONSUMO,
          quantidadeBase:
            values.draftTipoConsumo === 'VARIAVEL'
              ? undefined
              : values.draftQuantidadeBase,
        },
      ]);

      resetDraftFields();
    } catch {
      // Validacao tratada pelo Form do Ant Design.
    } finally {
      shouldValidateDraftRef.current = false;
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems((currentItems) => currentItems.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleFinish = async (values: InternalFormData) => {
    if (isEditing) {
      const normalizedItems = (values.itens || []).map(normalizeItemForSubmit);
      await onSubmit({
        tipoEstruturaId: values.tipoEstruturaId,
        itens: normalizedItems,
      });
      return;
    }

    if (items.length === 0) {
      message.warning('Adicione pelo menos um material.');
      return;
    }

    await onSubmit({
      tipoEstruturaId: values.tipoEstruturaId,
      itens: items.map(normalizeItemForSubmit),
    });
  };

  const handleFormFinish = (values: InternalFormData) => {
    handleFinish(values).catch(() => {});
  };

  const handleAddItemClick = () => {
    handleAddItem().catch(() => {});
  };

  const addedItemsColumns: ColumnsType<AddedItemRow> = [
    {
      title: 'Material',
      dataIndex: 'materialId',
      key: 'materialId',
      render: (materialId: number | undefined) => getMaterialLabel(materialId),
    },
    {
      title: 'Consumo',
      dataIndex: 'tipoConsumo',
      key: 'tipoConsumo',
      width: 140,
      render: (tipoConsumo?: ProjTipoConsumoMaterial) => (
        <Tag color={tipoConsumo === 'FIXO' ? 'blue' : 'gold'}>
          {tipoConsumo === 'FIXO' ? 'Fixo' : 'Variável'}
        </Tag>
      ),
    },
    {
      title: 'Qtd. Base',
      dataIndex: 'quantidadeBase',
      key: 'quantidadeBase',
      width: 140,
      render: (quantidadeBase: number | undefined, record) =>
        record.tipoConsumo === 'VARIAVEL' ? '-' : formatQuantidadeBase(quantidadeBase),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_: unknown, __: AddedItemRow, index: number) => (
        <Button
          danger
          type='text'
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(index)}
        />
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Form form={form} layout='vertical' onFinish={handleFormFinish}>
        <Form.Item
          name='tipoEstruturaId'
          label='Tipo de Estrutura'
          rules={[{ required: true, message: 'Tipo de estrutura é obrigatório' }]}
        >
          <Select
            showSearch
            placeholder='Selecione o tipo de estrutura'
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={tiposEstrutura.map((tipo) => ({
              value: tipo.id,
              label: tipo.nome,
            }))}
          />
        </Form.Item>

        {isEditing ? (
          <>
            <Form.Item
              name={['itens', 0, 'materialId']}
              label='Material'
              rules={[{ required: true, message: 'Material é obrigatório' }]}
            >
              <Select
                showSearch
                placeholder='Selecione o material'
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={materiais.map((material) => ({
                  value: material.id,
                  label: `${material.codigo} - ${material.descricao}`,
                }))}
              />
            </Form.Item>

            <Form.Item
              name={['itens', 0, 'tipoConsumo']}
              label='Tipo de Consumo'
              rules={[{ required: true, message: 'Tipo de consumo é obrigatório' }]}
            >
              <Select
                options={TIPO_CONSUMO_OPTIONS}
                placeholder='Selecione o tipo de consumo'
                onChange={(value: ProjTipoConsumoMaterial) => {
                  if (value === 'VARIAVEL') {
                    form.setFieldValue(['itens', 0, 'quantidadeBase'], undefined);
                  }
                }}
              />
            </Form.Item>

            {editingTipoConsumo === 'FIXO' ? (
              <Form.Item
                name={['itens', 0, 'quantidadeBase']}
                label='Quantidade Base'
                rules={[{ required: true, message: 'Quantidade base é obrigatória' }]}
              >
                <InputNumber
                  min={0.0001}
                  precision={4}
                  style={{ width: '100%' }}
                  placeholder='Quantidade base'
                />
              </Form.Item>
            ) : (
              <div
                style={{
                  marginBottom: 24,
                  padding: 12,
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  background: '#fafafa',
                  color: 'rgba(0, 0, 0, 0.65)',
                }}
              >
                {CONSUMO_VARIAVEL_HELPER_TEXT}
              </div>
            )}
          </>
        ) : (
          <>
            <div
              style={{
                marginBottom: 24,
                padding: 16,
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                background: '#fafafa',
              }}
            >
              <div style={{ marginBottom: 16, fontWeight: 600 }}>Adicionar material</div>

              <div
                style={{
                  display: 'grid',
                  gap: 16,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                }}
              >
                <Form.Item
                  name='draftMaterialId'
                  label='Material'
                  rules={[getDraftRequiredRule('Material é obrigatório')]}
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    showSearch
                    placeholder='Selecione o material'
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={materiais.map((material) => ({
                      value: material.id,
                      label: `${material.codigo} - ${material.descricao}`,
                      disabled: items.some((item) => item.materialId === material.id),
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  name='draftTipoConsumo'
                  label='Tipo de Consumo'
                  rules={[getDraftRequiredRule('Tipo de consumo é obrigatório')]}
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    options={TIPO_CONSUMO_OPTIONS}
                    placeholder='Selecione o tipo de consumo'
                    onChange={(value: ProjTipoConsumoMaterial) => {
                      if (value === 'VARIAVEL') {
                        form.setFieldValue('draftQuantidadeBase', undefined);
                      }
                    }}
                  />
                </Form.Item>

                {draftTipoConsumo === 'FIXO' ? (
                  <Form.Item
                    name='draftQuantidadeBase'
                    label='Quantidade Base'
                    rules={[getDraftRequiredRule('Quantidade base é obrigatória')]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      min={0.0001}
                      precision={4}
                      style={{ width: '100%' }}
                      placeholder='Quantidade base'
                    />
                  </Form.Item>
                ) : (
                  <div
                    style={{
                      alignSelf: 'end',
                      padding: 12,
                      border: '1px dashed #d9d9d9',
                      borderRadius: 8,
                      color: 'rgba(0, 0, 0, 0.65)',
                    }}
                  >
                    {CONSUMO_VARIAVEL_HELPER_TEXT}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: 16,
                }}
              >
                <Button
                  type='dashed'
                  icon={<PlusOutlined />}
                  onClick={handleAddItemClick}
                >
                  Adicionar material
                </Button>
              </div>
            </div>

            <Table<AddedItemRow>
              columns={addedItemsColumns}
              dataSource={items.map((item, index) => ({
                ...item,
                key: `${item.materialId ?? 'material'}-${index}`,
              }))}
              pagination={false}
              size='small'
              locale={{ emptyText: 'Nenhum material adicionado.' }}
            />
          </>
        )}

        <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
          <Button type='primary' htmlType='submit' block loading={loading}>
            {isEditing ? 'Salvar' : 'Salvar materiais'}
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
}
