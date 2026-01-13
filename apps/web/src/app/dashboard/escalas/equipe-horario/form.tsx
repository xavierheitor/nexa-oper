/**
 * Formulário de Associação Equipe → Horário
 *
 * Permite associar uma equipe a um horário do catálogo com período de vigência
 */

'use client';

import { useState, useEffect } from 'react';
import { Form, Select, DatePicker, Button, Space, Alert, Card, Input } from 'antd';
import { ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { listEquipes } from '@/lib/actions/equipe/list';
import { listHorarioAberturaCatalogo } from '@/lib/actions/escala/horarioAberturaCatalogo';
import { HorarioAberturaCatalogo, Equipe } from '@nexa-oper/db';

interface EquipeTurnoHistoricoFormProps {
  initialValues?: {
    id?: number;
    equipeId?: number;
    horarioAberturaCatalogoId?: number | null;
    dataInicio?: Date;
    dataFim?: Date | null;
    inicioTurnoHora?: string;
    duracaoHoras?: number;
    duracaoIntervaloHoras?: number;
    motivo?: string | null;
    observacoes?: string | null;
  };
  onSubmit: (values: unknown) => Promise<void>;
  onCancel: () => void;
  disableEquipeSelect?: boolean; // Nova prop para desabilitar o select de equipe
}

export default function EquipeTurnoHistoricoForm({
  initialValues,
  onSubmit,
  onCancel,
  disableEquipeSelect = false,
}: EquipeTurnoHistoricoFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [horarioSelecionado, setHorarioSelecionado] = useState<HorarioAberturaCatalogo | null>(null);

  // Carregar equipes
  const { data: equipes, isLoading: equipesLoading } = useEntityData({
    key: 'equipes-turno',
    fetcherAction: async () => {
      const result = await listEquipes({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
      });
      return result.success && result.data ? result.data.data : [];
    },
    paginationEnabled: false,
  });

  // Carregar horários do catálogo
  const { data: horarios, isLoading: horariosLoading } = useEntityData({
    key: 'horarios-catalogo',
    fetcherAction: async () => {
      const result = await listHorarioAberturaCatalogo({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
        ativo: true,
      });
      return result.success && result.data ? result.data.data : [];
    },
    paginationEnabled: false,
  });

  const calcularHorarioFim = (inicio: string, duracao: number, intervalo: number = 0): string => {
    const [horas, minutos] = inicio.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos + (duracao + intervalo) * 60;
    const horasFim = Math.floor(totalMinutos / 60) % 24;
    const minutosFim = totalMinutos % 60;
    return `${String(horasFim).padStart(2, '0')}:${String(minutosFim).padStart(2, '0')}`;
  };

  interface FormValues {
    equipeId: number;
    horarioAberturaCatalogoId?: number;
    dataInicio: dayjs.Dayjs;
    dataFim?: dayjs.Dayjs | null;
    motivo?: string;
    observacoes?: string;
  }

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Validar que a data início existe e é válida
      if (!values.dataInicio || !values.dataInicio.isValid()) {
        form.setFields([{
          name: 'dataInicio',
          errors: ['Data de início é obrigatória e deve ser válida']
        }]);
        setLoading(false);
        return;
      }

      // Se selecionou um horário do catálogo, pega os dados dele
      const horario = horarioSelecionado || {
        inicioTurnoHora: '08:00:00',
        duracaoHoras: 8,
        duracaoIntervaloHoras: 1,
      };

      const dataInicio = values.dataInicio.toDate();
      const dataFim = values.dataFim && values.dataFim.isValid()
        ? values.dataFim.toDate()
        : null;

      // Validar que dataFim é maior ou igual a dataInicio se ambas existirem
      if (dataFim && dataFim < dataInicio) {
        form.setFields([{
          name: 'dataFim',
          errors: ['Data fim deve ser maior ou igual à data início']
        }]);
        setLoading(false);
        return;
      }

      const submitData = {
        equipeId: values.equipeId,
        horarioAberturaCatalogoId: values.horarioAberturaCatalogoId,
        dataInicio,
        dataFim,
        inicioTurnoHora: horario.inicioTurnoHora,
        duracaoHoras: Number(horario.duracaoHoras),
        duracaoIntervaloHoras: Number(horario.duracaoIntervaloHoras || 0),
        motivo: values.motivo,
        observacoes: values.observacoes,
      };

      await onSubmit(submitData);
      form.resetFields();
    } finally {
      setLoading(false);
    }
  };

  const formInitialValues = initialValues
    ? {
        equipeId: initialValues.equipeId,
        horarioAberturaCatalogoId: initialValues.horarioAberturaCatalogoId || undefined,
        dataInicio: dayjs(initialValues.dataInicio),
        dataFim: initialValues.dataFim ? dayjs(initialValues.dataFim) : null,
        motivo: initialValues.motivo || undefined,
        observacoes: initialValues.observacoes || undefined,
      }
    : {};

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={formInitialValues}
      onFinish={handleSubmit}
    >
      <Alert
        message="Associar Equipe a Horário"
        description="Selecione uma equipe e o horário que ela deve usar. O horário pode ser um preset do catálogo ou personalizado."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form.Item
        name="equipeId"
        label="Equipe"
        rules={[{ required: true, message: 'Equipe é obrigatória' }]}
      >
        <Select
          placeholder="Selecione uma equipe"
          loading={equipesLoading}
          showSearch
          disabled={disableEquipeSelect}
          filterOption={(input, option) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
          options={equipes?.map((equipe: Equipe) => ({
            value: equipe.id,
            label: equipe.nome,
          }))}
        />
      </Form.Item>

      <Form.Item
        name="horarioAberturaCatalogoId"
        label="Horário do Catálogo"
        rules={[{ required: true, message: 'Selecione um horário' }]}
        tooltip="Selecione um horário do catálogo para usar como modelo"
      >
        <Select
          placeholder="Selecione um horário"
          loading={horariosLoading}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
          onChange={(value) => {
            const horario = horarios?.find((h: any) => h.id === value);
            setHorarioSelecionado(horario);
          }}
          options={horarios?.map((horario: any) => ({
            value: horario.id,
            label: horario.nome,
          }))}
        />
      </Form.Item>

      {horarioSelecionado && (
        <Card size="small" style={{ marginBottom: 16, background: '#f6ffed' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <strong>Horário Selecionado:</strong>
            </div>
            <Space>
              <ClockCircleOutlined />
              <span>
                {horarioSelecionado.inicioTurnoHora.substring(0, 5)} às{' '}
                {calcularHorarioFim(
                  horarioSelecionado.inicioTurnoHora,
                  Number(horarioSelecionado.duracaoHoras),
                  Number(horarioSelecionado.duracaoIntervaloHoras)
                )}
              </span>
            </Space>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {Number(horarioSelecionado.duracaoHoras)}h trabalho + {Number(horarioSelecionado.duracaoIntervaloHoras)}h intervalo
            </div>
          </Space>
        </Card>
      )}

      <Form.Item
        name="dataInicio"
        label="Data Início"
        rules={[{ required: true, message: 'Data início é obrigatória' }]}
        tooltip="Data em que este horário passa a valer para a equipe"
      >
        <DatePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          placeholder="Selecione a data início"
        />
      </Form.Item>

      <Form.Item
        name="dataFim"
        label="Data Fim (Opcional)"
        tooltip="Deixe vazio para mudança permanente. Se preenchida, define quando este horário deixa de valer"
        dependencies={['dataInicio']}
        rules={[
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value) {
                return Promise.resolve();
              }
              const dataInicio = getFieldValue('dataInicio');
              if (dataInicio && value.isBefore(dataInicio, 'day')) {
                return Promise.reject(new Error('Data fim deve ser maior ou igual à data início'));
              }
              return Promise.resolve();
            },
          }),
        ]}
      >
        <DatePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          placeholder="Deixe vazio para mudança permanente"
        />
      </Form.Item>

      <Form.Item
        name="motivo"
        label="Motivo da Mudança"
        tooltip="Opcional: descreva o motivo desta configuração (ex: 'Horário de verão')"
        rules={[
          { max: 500, message: 'Motivo deve ter no máximo 500 caracteres' }
        ]}
      >
        <Input placeholder="Ex: Mudança de turno, Horário de verão..." maxLength={500} />
      </Form.Item>

      <Form.Item
        name="observacoes"
        label="Observações"
        rules={[
          { max: 1000, message: 'Observações deve ter no máximo 1000 caracteres' }
        ]}
      >
        <Input.TextArea
          rows={2}
          placeholder="Observações adicionais..."
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <Alert
        message={<Space><InfoCircleOutlined /> Snapshot de Horário</Space>}
        description="Os horários são copiados para este registro (snapshot), então mudanças no catálogo não afetam associações já criadas."
        type="warning"
        showIcon={false}
        style={{ marginBottom: 16 }}
      />

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Salvar
          </Button>
          <Button onClick={onCancel}>
            Cancelar
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

