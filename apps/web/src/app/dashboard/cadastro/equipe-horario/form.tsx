/**
 * Formulário de Associação Equipe → Horário
 *
 * Permite associar uma equipe a um horário do catálogo com período de vigência
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Form, Select, DatePicker, Button, Space, Alert, Card, Input } from 'antd';
import { ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { listEquipes } from '@/lib/actions/equipe/list';
import { listHorarioAberturaCatalogo } from '@/lib/actions/escala/horarioAberturaCatalogo';

const { RangePicker } = DatePicker;

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
}

export default function EquipeTurnoHistoricoForm({
  initialValues,
  onSubmit,
  onCancel,
}: EquipeTurnoHistoricoFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [horarioSelecionado, setHorarioSelecionado] = useState<any>(null);

  // Carregar equipes
  const { data: equipes, isLoading: equipesLoading } = useEntityData({
    key: 'equipes-turno',
    fetcher: async () => {
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
    fetcher: async () => {
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

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Se selecionou um horário do catálogo, pega os dados dele
      const horario = horarioSelecionado || {
        inicioTurnoHora: '08:00:00',
        duracaoHoras: 8,
        duracaoIntervaloHoras: 1,
      };

      const submitData = {
        equipeId: values.equipeId,
        horarioAberturaCatalogoId: values.horarioAberturaCatalogoId,
        dataInicio: values.vigencia[0].toDate(),
        dataFim: values.vigencia[1] ? values.vigencia[1].toDate() : null,
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
        vigencia: [
          dayjs(initialValues.dataInicio),
          initialValues.dataFim ? dayjs(initialValues.dataFim) : null,
        ],
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
          optionFilterProp="children"
          options={equipes?.map((equipe: any) => ({
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
          optionFilterProp="children"
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
              {horarioSelecionado.duracaoHoras}h trabalho + {horarioSelecionado.duracaoIntervaloHoras}h intervalo
            </div>
          </Space>
        </Card>
      )}

      <Form.Item
        name="vigencia"
        label="Período de Vigência"
        rules={[{ required: true, message: 'Período é obrigatório' }]}
        tooltip="Defina quando esta equipe usará este horário. Deixe a data fim vazia para vigência atual"
      >
        <RangePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          placeholder={['Início', 'Fim (deixe vazio se atual)']}
        />
      </Form.Item>

      <Form.Item
        name="motivo"
        label="Motivo da Mudança"
        tooltip="Opcional: descreva o motivo desta configuração (ex: 'Horário de verão')"
      >
        <Input placeholder="Ex: Mudança de turno, Horário de verão..." maxLength={500} />
      </Form.Item>

      <Form.Item
        name="observacoes"
        label="Observações"
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

