'use client';

/**
 * Formulário de criação/edição de Escalas
 *
 * Este componente concentra todos os campos necessários para cadastrar ou
 * atualizar uma escala, incluindo a definição do ciclo de horários. Ele é
 * utilizado tanto na criação quanto na edição, recebendo valores iniciais
 * opcionais e emitindo o payload normalizado para as Server Actions.
 */

import { Escala } from '@nexa-oper/db';
import dayjs, { Dayjs } from 'dayjs';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import type { EscalaHorarioInput } from '@/lib/schemas/escalaSchema';

const { Title, Text } = Typography;

/**
 * Tipo dos valores manipulados pelo formulário (com Dayjs para datas).
 */
export interface EscalaFormValues {
  nome: string;
  descricao?: string | null;
  codigo?: string | null;
  contratoId: number | null;
  tipoVeiculo?: Escala['tipoVeiculo'] | null;
  diasCiclo: number;
  minimoEletricistas: number;
  maximoEletricistas?: number | null;
  inicioCiclo: Dayjs;
  ativo: boolean;
  horarios: Array<EscalaHorarioInput>;
}

/**
 * Payload emitido ao submeter o formulário.
 */
export interface EscalaFormSubmitPayload {
  id?: number;
  nome: string;
  descricao?: string | null;
  codigo?: string | null;
  contratoId: number;
  tipoVeiculo?: Escala['tipoVeiculo'] | null;
  diasCiclo: number;
  minimoEletricistas: number;
  maximoEletricistas?: number | null;
  inicioCiclo: string;
  ativo: boolean;
  horarios: EscalaHorarioInput[];
}

export interface EscalaFormProps {
  form: FormInstance<EscalaFormValues>;
  initialData?: Escala & { horarios: EscalaHorarioInput[] };
  contratos: Array<{ id: number; nome: string }>;
  loading?: boolean;
  onSubmit: (values: EscalaFormSubmitPayload) => void;
}

const DIA_SEMANA_OPTIONS = [
  { label: 'Domingo', value: 0 },
  { label: 'Segunda-feira', value: 1 },
  { label: 'Terça-feira', value: 2 },
  { label: 'Quarta-feira', value: 3 },
  { label: 'Quinta-feira', value: 4 },
  { label: 'Sexta-feira', value: 5 },
  { label: 'Sábado', value: 6 },
];

const TIPO_VEICULO_OPTIONS: Array<{ label: string; value: Escala['tipoVeiculo'] }> = [
  { label: 'Carro', value: 'CARRO' },
  { label: 'Caminhão', value: 'CAMINHAO' },
  { label: 'Outro', value: 'OUTRO' },
];

/**
 * Constrói valores padrão para novos formulários.
 */
const buildDefaultValues = (): EscalaFormValues => ({
  nome: '',
  descricao: undefined,
  codigo: undefined,
  contratoId: null,
  tipoVeiculo: undefined,
  diasCiclo: 7,
  minimoEletricistas: 1,
  maximoEletricistas: undefined,
  inicioCiclo: dayjs(),
  ativo: true,
  horarios: [
    {
      indiceCiclo: 0,
      diaSemana: 1,
      horaInicio: '08:00',
      horaFim: '17:00',
      eletricistasNecessarios: 2,
      folga: false,
      etiqueta: 'Turno padrão',
      rotacaoOffset: 0,
    },
  ],
});

/**
 * Normaliza dados recebidos para preencher o formulário.
 */
const mapInitialData = (
  data: Escala & { horarios: EscalaHorarioInput[] }
): EscalaFormValues => ({
  nome: data.nome,
  descricao: data.descricao ?? undefined,
  codigo: data.codigo ?? undefined,
  contratoId: data.contratoId,
  tipoVeiculo: data.tipoVeiculo ?? undefined,
  diasCiclo: data.diasCiclo,
  minimoEletricistas: data.minimoEletricistas,
  maximoEletricistas: data.maximoEletricistas ?? undefined,
  inicioCiclo: dayjs(data.inicioCiclo),
  ativo: data.ativo,
  horarios: data.horarios.map(horario => ({
    id: horario.id,
    indiceCiclo: horario.indiceCiclo,
    diaSemana: horario.diaSemana ?? undefined,
    horaInicio: horario.horaInicio ?? undefined,
    horaFim: horario.horaFim ?? undefined,
    eletricistasNecessarios: horario.eletricistasNecessarios,
    folga: horario.folga,
    etiqueta: horario.etiqueta ?? undefined,
    rotacaoOffset: horario.rotacaoOffset ?? 0,
  })),
});

const EscalaForm: React.FC<EscalaFormProps> = ({
  form,
  initialData,
  contratos,
  loading,
  onSubmit,
}) => {
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(mapInitialData(initialData));
    } else {
      form.setFieldsValue(buildDefaultValues());
    }
  }, [initialData, form]);

  const handleFinish = (values: EscalaFormValues) => {
    if (values.contratoId === null) {
      form.setFields([
        {
          name: 'contratoId',
          errors: ['Selecione um contrato válido'],
        },
      ]);
      return;
    }

    const payload: EscalaFormSubmitPayload = {
      ...(initialData ? { id: initialData.id } : {}),
      nome: values.nome.trim(),
      descricao: values.descricao?.trim() || undefined,
      codigo: values.codigo?.trim() || undefined,
      contratoId: Number(values.contratoId),
      tipoVeiculo: values.tipoVeiculo ?? null,
      diasCiclo: values.diasCiclo,
      minimoEletricistas: values.minimoEletricistas,
      maximoEletricistas: values.maximoEletricistas ?? null,
      inicioCiclo: values.inicioCiclo.toISOString(),
      ativo: values.ativo,
      horarios: values.horarios.map(horario => ({
        indiceCiclo: horario.indiceCiclo,
        diaSemana: horario.diaSemana ?? null,
        horaInicio: horario.horaInicio ?? null,
        horaFim: horario.horaFim ?? null,
        eletricistasNecessarios: horario.eletricistasNecessarios,
        folga: horario.folga ?? false,
        etiqueta: horario.etiqueta ?? null,
        rotacaoOffset: horario.rotacaoOffset ?? 0,
      })),
    };

    onSubmit(payload);
  };

  return (
    <Form form={form} layout='vertical' onFinish={handleFinish} disabled={loading}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name='nome'
            label='Nome da escala'
            rules={[{ required: true, message: 'Informe o nome da escala' }]}
          >
            <Input placeholder='Ex: Escala Espanhola' maxLength={191} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name='codigo' label='Código interno'>
            <Input placeholder='Código opcional para relatórios' maxLength={64} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name='contratoId'
            label='Contrato'
            rules={[{ required: true, message: 'Selecione um contrato' }]}
          >
            <Select
              placeholder='Selecione o contrato'
              options={contratos.map(contrato => ({
                label: contrato.nome,
                value: contrato.id,
              }))}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name='tipoVeiculo' label='Tipo de veículo recomendado'>
            <Select
              allowClear
              placeholder='Selecione (opcional)'
              options={TIPO_VEICULO_OPTIONS}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name='descricao' label='Descrição'>
        <Input.TextArea
          placeholder='Descreva detalhes importantes da escala'
          rows={3}
          maxLength={5000}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={6}>
          <Form.Item
            name='diasCiclo'
            label='Dias do ciclo'
            rules={[{ required: true, message: 'Informe os dias do ciclo' }]}
          >
            <InputNumber min={1} className='w-full' />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name='minimoEletricistas'
            label='Mínimo de eletricistas'
            rules={[{ required: true, message: 'Informe o mínimo de eletricistas' }]}
          >
            <InputNumber min={1} className='w-full' />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name='maximoEletricistas' label='Máximo de eletricistas'>
            <InputNumber min={1} className='w-full' />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name='inicioCiclo'
            label='Início do ciclo'
            rules={[{ required: true, message: 'Informe o início do ciclo' }]}
          >
            <DatePicker format='YYYY-MM-DD' className='w-full' />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name='ativo' label='Escala ativa' valuePropName='checked'>
        <Switch />
      </Form.Item>

      <Card title='Horários do ciclo' bordered={false}>
        <Form.List name='horarios'>
          {(fields, { add, remove }) => (
            <Space direction='vertical' className='w-full'>
              {fields.map((field, index) => (
                <Card
                  key={field.key}
                  size='small'
                  title={`Dia ${index + 1}`}
                  extra={
                    fields.length > 1 ? (
                      <Button
                        type='text'
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(field.name)}
                      >
                        Remover
                      </Button>
                    ) : null
                  }
                >
                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item
                        name={[field.name, 'indiceCiclo']}
                        label='Índice do ciclo'
                        rules={[{ required: true, message: 'Informe o índice' }]}
                      >
                        <InputNumber min={0} className='w-full' />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name={[field.name, 'diaSemana']} label='Dia da semana'>
                        <Select
                          allowClear
                          options={DIA_SEMANA_OPTIONS}
                          placeholder='Opcional'
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name={[field.name, 'horaInicio']} label='Hora início'>
                        <Input placeholder='HH:mm' maxLength={5} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name={[field.name, 'horaFim']} label='Hora fim'>
                        <Input placeholder='HH:mm' maxLength={5} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item
                        name={[field.name, 'eletricistasNecessarios']}
                        label='Eletricistas necessários'
                        rules={[{ required: true, message: 'Informe a quantidade' }]}
                      >
                        <InputNumber min={0} className='w-full' />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name={[field.name, 'rotacaoOffset']}
                        label='Offset de rotação'
                      >
                        <InputNumber min={0} className='w-full' />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name={[field.name, 'folga']} label='Folga' valuePropName='checked'>
                        <Switch />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name={[field.name, 'etiqueta']} label='Etiqueta'>
                        <Input placeholder='Ex: Noturno' maxLength={64} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}

              <Button
                type='dashed'
                onClick={() =>
                  add({
                    indiceCiclo: fields.length,
                    diaSemana: undefined,
                    horaInicio: '08:00',
                    horaFim: '17:00',
                    eletricistasNecessarios: 1,
                    folga: false,
                    etiqueta: undefined,
                    rotacaoOffset: 0,
                  })
                }
                block
                icon={<PlusOutlined />}
              >
                Adicionar horário
              </Button>
            </Space>
          )}
        </Form.List>
      </Card>

      <div className='mt-6'>
        <Space direction='vertical' className='w-full'>
          <Title level={5}>Resumo</Title>
          <Text type='secondary'>Revise os dados antes de confirmar.</Text>
          <Button type='primary' htmlType='submit' loading={loading}>
            {initialData ? 'Atualizar escala' : 'Cadastrar escala'}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default EscalaForm;
