'use client';

import { Form, DatePicker, Select, Button, Checkbox } from 'antd';
import type { FormInstance } from 'antd/es/form';
import dayjs, { Dayjs } from 'dayjs';

interface Equipe {
  id: number;
  nome: string;
}

interface ReconciliacaoFormProps {
  form: FormInstance;
  equipes: Equipe[];
  todasEquipes: boolean;
  loading: boolean;
  onTodasEquipesChange: (checked: boolean) => void;
  onSubmit: (values: { dataReferencia: Dayjs; equipeId?: number }) => void;
}

/**
 * Componente de Formulário de Reconciliação Manual
 *
 * Permite selecionar equipe (ou todas) e data de referência para executar a reconciliação
 */
export function ReconciliacaoForm({
  form,
  equipes,
  todasEquipes,
  loading,
  onTodasEquipesChange,
  onSubmit,
}: ReconciliacaoFormProps) {
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={{
        dataReferencia: dayjs(),
      }}
    >
      <Form.Item>
        <Checkbox
          checked={todasEquipes}
          onChange={(e) => {
            const checked = e.target.checked;
            onTodasEquipesChange(checked);
            if (checked) {
              form.resetFields(['equipeId']);
            }
          }}
        >
          Executar para todas as equipes com escala publicada
        </Checkbox>
      </Form.Item>

      {!todasEquipes && (
        <Form.Item
          name="equipeId"
          label="Equipe"
          rules={[{ required: !todasEquipes, message: 'Selecione uma equipe' }]}
        >
          <Select
            placeholder="Selecione uma equipe"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={equipes.map((e) => ({
              value: e.id,
              label: `${e.nome} (ID: ${e.id})`,
            }))}
          />
        </Form.Item>
      )}

      <Form.Item
        name="dataReferencia"
        label="Data de Referência"
        rules={[{ required: true, message: 'Selecione uma data' }]}
      >
        <DatePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          placeholder="Selecione a data"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Executar Reconciliação
        </Button>
      </Form.Item>
    </Form>
  );
}

