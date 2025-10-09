/**
 * Formulário de Horário (Catálogo)
 *
 * Componente para criação e edição de horários (presets reutilizáveis)
 */

'use client';

import React, { useState } from 'react';
import { Form, Input, TimePicker, InputNumber, Switch, Button, Space, Alert, Card } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface HorarioAberturaCatalogoFormProps {
  initialValues?: {
    id?: number;
    nome?: string;
    inicioTurnoHora?: string;
    duracaoHoras?: number;
    duracaoIntervaloHoras?: number;
    ativo?: boolean;
    observacoes?: string;
  };
  onSubmit: (values: unknown) => Promise<void>;
  onCancel: () => void;
}

export default function HorarioAberturaCatalogoForm({
  initialValues,
  onSubmit,
  onCancel,
}: HorarioAberturaCatalogoFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [duracaoHoras, setDuracaoHoras] = useState<number>(
    initialValues?.duracaoHoras || 8
  );
  const [duracaoIntervalo, setDuracaoIntervalo] = useState<number>(
    initialValues?.duracaoIntervaloHoras || 1
  );
  const [inicioHora, setInicioHora] = useState<string>(
    initialValues?.inicioTurnoHora || '08:00:00'
  );

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
      const submitData = {
        nome: values.nome,
        inicioTurnoHora: values.inicioTurnoHora.format('HH:mm:ss'),
        duracaoHoras: values.duracaoHoras,
        duracaoIntervaloHoras: values.duracaoIntervaloHoras || 0,
        ativo: values.ativo ?? true,
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
        nome: initialValues.nome,
        inicioTurnoHora: initialValues.inicioTurnoHora
          ? dayjs(initialValues.inicioTurnoHora, 'HH:mm:ss')
          : dayjs('08:00:00', 'HH:mm:ss'),
        duracaoHoras: initialValues.duracaoHoras || 8,
        duracaoIntervaloHoras: initialValues.duracaoIntervaloHoras || 1,
        ativo: initialValues.ativo ?? true,
        observacoes: initialValues.observacoes,
      }
    : {
        duracaoHoras: 8,
        duracaoIntervaloHoras: 1,
        inicioTurnoHora: dayjs('08:00:00', 'HH:mm:ss'),
        ativo: true,
      };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={formInitialValues}
      onFinish={handleSubmit}
      onValuesChange={(changedValues) => {
        if (changedValues.duracaoHoras) {
          setDuracaoHoras(changedValues.duracaoHoras);
        }
        if (changedValues.duracaoIntervaloHoras !== undefined) {
          setDuracaoIntervalo(changedValues.duracaoIntervaloHoras);
        }
        if (changedValues.inicioTurnoHora) {
          setInicioHora(changedValues.inicioTurnoHora.format('HH:mm:ss'));
        }
      }}
    >
      <Alert
        message="Catálogo de Horários"
        description="Crie horários reutilizáveis que podem ser associados a múltiplas equipes. Ex: '08h às 17h (8h + 1h intervalo)'"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form.Item
        name="nome"
        label="Nome do Horário"
        rules={[
          { required: true, message: 'Nome é obrigatório' },
          { max: 255, message: 'Máximo 255 caracteres' },
        ]}
        tooltip="Dê um nome descritivo. Ex: '08h • 8h + 1h int.', 'Manhã 6h', etc"
      >
        <Input placeholder="Ex: 08h • 8h + 1h int." />
      </Form.Item>

      <Card size="small" style={{ marginBottom: 16, background: '#f0f5ff' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <Form.Item
              name="inicioTurnoHora"
              label="Horário de Início"
              rules={[{ required: true, message: 'Horário é obrigatório' }]}
              style={{ marginBottom: 0, flex: 1 }}
            >
              <TimePicker
                format="HH:mm"
                placeholder="Ex: 08:00"
                style={{ width: '100%' }}
                minuteStep={15}
              />
            </Form.Item>

            <Form.Item
              name="duracaoHoras"
              label="Duração (horas)"
              rules={[
                { required: true, message: 'Duração é obrigatória' },
                { type: 'number', min: 1, max: 24, message: 'Entre 1 e 24 horas' },
              ]}
              style={{ marginBottom: 0, flex: 1 }}
            >
              <InputNumber
                min={1}
                max={24}
                step={0.5}
                placeholder="Ex: 8"
                style={{ width: '100%' }}
                addonAfter="horas"
              />
            </Form.Item>

            <Form.Item
              name="duracaoIntervaloHoras"
              label="Intervalo (horas)"
              rules={[
                { type: 'number', min: 0, max: 4, message: 'Entre 0 e 4 horas' },
              ]}
              style={{ marginBottom: 0, flex: 1 }}
            >
              <InputNumber
                min={0}
                max={4}
                step={0.5}
                placeholder="Ex: 1"
                style={{ width: '100%' }}
                addonAfter="horas"
              />
            </Form.Item>
          </div>

          <Alert
            message={
              <Space>
                <ClockCircleOutlined />
                <span>
                  Horário: {inicioHora.substring(0, 5)} às{' '}
                  {calcularHorarioFim(inicioHora, duracaoHoras, duracaoIntervalo)}
                  {' '}({duracaoHoras}h trabalho + {duracaoIntervalo}h intervalo = {duracaoHoras + duracaoIntervalo}h total)
                </span>
              </Space>
            }
            type="success"
            showIcon={false}
          />
        </Space>
      </Card>

      <Form.Item
        name="ativo"
        label="Ativo"
        valuePropName="checked"
      >
        <Switch checkedChildren="Sim" unCheckedChildren="Não" />
      </Form.Item>

      <Form.Item
        name="observacoes"
        label="Observações"
      >
        <Input.TextArea
          rows={3}
          placeholder="Observações sobre este horário..."
          maxLength={1000}
          showCount
        />
      </Form.Item>

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

