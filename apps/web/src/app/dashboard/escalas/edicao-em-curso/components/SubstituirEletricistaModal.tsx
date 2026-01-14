import React, { useEffect } from 'react';
import { Modal, Form, Select, DatePicker, App, Alert } from 'antd';
import { Dayjs } from 'dayjs';
import { substituirEletricistaAction } from '@/lib/actions/escala/substituirEletricista';

const { RangePicker } = DatePicker;

interface Props {
  visible: boolean;
  onClose: () => void;
  dados: {
    escalaId: number;
    eletricistaSaiId: number;
    eletricistaSaiNome: string;
    periodoInicial: [Dayjs, Dayjs];
  } | null;
  eletricistas: any[];
  onSuccess: () => void;
}

export default function SubstituirEletricistaModal({
  visible,
  onClose,
  dados,
  eletricistas,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (visible && dados) {
      form.setFieldsValue({
        substitutoId: undefined,
        periodo: dados.periodoInicial,
      });
    }
  }, [visible, dados, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (!dados) return;

      const result = await substituirEletricistaAction({
        escalaId: dados.escalaId,
        eletricistaSaiId: dados.eletricistaSaiId,
        eletricistaEntraId: values.substitutoId,
        dataInicio: values.periodo[0].toDate(),
        dataFim: values.periodo[1].toDate(),
      });

      if (result.success) {
        message.success(
          result.data?.message || 'Substituição realizada com sucesso!'
        );
        onSuccess();
        onClose();
      } else {
        message.error(result.error || 'Erro ao realizar substituição');
      }
    } catch (error) {
      console.error(error);
      message.error('Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const listaEletricistas = Array.isArray(eletricistas)
    ? eletricistas
    : (eletricistas as any)?.data || [];

  return (
    <Modal
      title='Substituir Eletricista na Escala'
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText='Confirmar Substituição'
    >
      <Alert
        message='Atenção'
        description={`Você está substituindo ${dados?.eletricistaSaiNome}. Esta ação irá transferir todos os agendamentos no período selecionado para o novo eletricista.`}
        type='warning'
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout='vertical'>
        <Form.Item label='Eletricista Original (Sai)'>
          <Select
            disabled
            value={dados?.eletricistaSaiNome}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label='Eletricista Substituto (Entra)'
          name='substitutoId'
          rules={[{ required: true, message: 'Selecione o substituto' }]}
        >
          <Select
            placeholder='Selecione o substituto'
            showSearch
            optionFilterProp='label'
            options={listaEletricistas
              .filter((e: any) => e.id !== dados?.eletricistaSaiId)
              .map((e: any) => ({
                value: e.id,
                label: `${e.nome} (${e.matricula})`,
              }))}
          />
        </Form.Item>

        <Form.Item
          label='Período da Substituição'
          name='periodo'
          rules={[{ required: true, message: 'Selecione o período' }]}
        >
          <RangePicker style={{ width: '100%' }} format='DD/MM/YYYY' />
        </Form.Item>
      </Form>
    </Modal>
  );
}
