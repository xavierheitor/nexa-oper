/**
 * Formulário para cadastro em lote de Eletricistas
 */

'use client';

import { useState } from 'react';
import { Alert, Button, Card, DatePicker, Form, Input, Select, Space, Table, Tag, App } from 'antd';
import { DeleteOutlined, PlusOutlined, FileExcelOutlined } from '@ant-design/icons';
import type { Cargo, Contrato } from '@nexa-oper/db';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

interface EletricistaLoteItem {
  nome: string;
  matricula: string;
  telefone: string;
  estado: string;
  admissao: Date;
}

interface EletricistaLoteFormData {
  contratoId: number;
  cargoId: number;
  baseId: number;
  eletricistas: EletricistaLoteItem[];
}

interface EletricistaLoteFormProps {
  onSubmit: (values: EletricistaLoteFormData) => void;
  loading?: boolean;
  contratos: Contrato[];
  cargos: Cargo[];
  bases: any[];
}

export default function EletricistaLoteForm({
  onSubmit,
  loading = false,
  contratos,
  cargos,
  bases,
}: EletricistaLoteFormProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [eletricistas, setEletricistas] = useState<EletricistaLoteItem[]>([]);
  const [pasteValue, setPasteValue] = useState('');

  const parseDate = (dateStr: string): Date => {
    // Tenta parsear no formato dd/mm/yyyy
    const parsed = dayjs(dateStr, 'DD/MM/YYYY', true);
    if (parsed.isValid()) {
      return parsed.toDate();
    }
    throw new Error(`Data inválida: ${dateStr}. Use o formato dd/mm/yyyy`);
  };

  const handlePaste = () => {
    if (!pasteValue.trim()) {
      message.warning('Cole os dados do Excel antes de processar');
      return;
    }

    try {
      const lines = pasteValue.trim().split('\n');
      const novosEletricistas: EletricistaLoteItem[] = lines.map((line, index) => {
        const parts = line.split('\t').map(p => p.trim());

        if (parts.length < 5) {
          throw new Error(
            `Linha ${index + 1}: formato inválido. Esperado: Nome, Matrícula, Telefone, Estado, Data Admissão (dd/mm/yyyy)`
          );
        }

        const admissao = parseDate(parts[4]);

        return {
          nome: parts[0],
          matricula: parts[1],
          telefone: parts[2],
          estado: parts[3].substring(0, 2).toUpperCase(),
          admissao,
        };
      });

      setEletricistas(novosEletricistas);
      setPasteValue('');
      message.success(`${novosEletricistas.length} eletricista(s) carregado(s)`);
    } catch (error: any) {
      message.error(error.message || 'Erro ao processar dados colados');
    }
  };

  const handleRemoveEletricista = (index: number) => {
    setEletricistas(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (values: any) => {
    if (eletricistas.length === 0) {
      message.warning('Adicione pelo menos um eletricista');
      return;
    }

    onSubmit({
      contratoId: values.contratoId,
      cargoId: values.cargoId,
      baseId: values.baseId,
      eletricistas,
    });
  };

  const handleUpdateEletricista = (index: number, field: keyof EletricistaLoteItem, value: string | Date) => {
    setEletricistas(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={e => handleUpdateEletricista(index, 'nome', e.target.value)}
          placeholder="Nome completo"
        />
      ),
    },
    {
      title: 'Matrícula',
      dataIndex: 'matricula',
      key: 'matricula',
      width: 130,
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={e => handleUpdateEletricista(index, 'matricula', e.target.value)}
          placeholder="Matrícula"
        />
      ),
    },
    {
      title: 'Telefone',
      dataIndex: 'telefone',
      key: 'telefone',
      width: 140,
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={e => handleUpdateEletricista(index, 'telefone', e.target.value)}
          placeholder="(00) 00000-0000"
        />
      ),
    },
    {
      title: 'UF',
      dataIndex: 'estado',
      key: 'estado',
      width: 70,
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={e => handleUpdateEletricista(index, 'estado', e.target.value.substring(0, 2).toUpperCase())}
          placeholder="SP"
          maxLength={2}
          style={{ textAlign: 'center' }}
        />
      ),
    },
    {
      title: 'Data Admissão',
      dataIndex: 'admissao',
      key: 'admissao',
      width: 150,
      render: (date: Date, _: any, index: number) => (
        <DatePicker
          value={dayjs(date)}
          onChange={(value) => value && handleUpdateEletricista(index, 'admissao', value.toDate())}
          format="DD/MM/YYYY"
          placeholder="dd/mm/yyyy"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, __: any, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveEletricista(index)}
        />
      ),
    },
  ];

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Alert
        message="Cadastro em Lote de Eletricistas"
        description="Selecione o contrato, cargo e base. Cole os dados do Excel com as colunas: Nome, Matrícula, Telefone, Estado (UF), Data Admissão (dd/mm/yyyy)."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form.Item
        name="contratoId"
        label="Contrato"
        rules={[{ required: true, message: 'Selecione um contrato' }]}
      >
        <Select placeholder="Selecione o contrato" showSearch optionFilterProp="children">
          {contratos.map(c => (
            <Select.Option key={c.id} value={c.id}>
              {c.nome}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="cargoId"
        label="Cargo"
        rules={[{ required: true, message: 'Selecione um cargo' }]}
        tooltip="Todos os eletricistas serão cadastrados com este cargo"
      >
        <Select
          placeholder="Selecione o cargo"
          showSearch
          optionFilterProp="children"
          loading={!cargos || cargos.length === 0}
        >
          {cargos?.map(c => (
            <Select.Option key={c.id} value={c.id}>
              {c.nome} - R$ {Number(c.salarioBase || 0).toFixed(2)}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="baseId"
        label="Base"
        rules={[{ required: true, message: 'Selecione uma base' }]}
        tooltip="Todos os eletricistas serão lotados nesta base"
      >
        <Select
          placeholder="Selecione a base"
          showSearch
          optionFilterProp="children"
          loading={!bases || bases.length === 0}
        >
          {bases?.map(b => (
            <Select.Option key={b.id} value={b.id}>
              {b.nome}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Card
        title={
          <Space>
            <FileExcelOutlined style={{ color: '#52c41a' }} />
            <span>Dados do Excel</span>
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Alert
          message="Formato esperado"
          description={
            <div>
              Cole os dados com as seguintes colunas separadas por TAB:
              <ol style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                <li><strong>Nome</strong> - Nome completo</li>
                <li><strong>Matrícula</strong> - Número da matrícula</li>
                <li><strong>Telefone</strong> - Telefone de contato</li>
                <li><strong>Estado</strong> - UF (2 letras)</li>
                <li><strong>Data Admissão</strong> - Formato dd/mm/yyyy</li>
              </ol>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
        />
        <Input.TextArea
          rows={6}
          placeholder="Cole aqui os dados do Excel...&#10;Exemplo:&#10;João Silva[TAB]12345[TAB](11) 98765-4321[TAB]SP[TAB]01/01/2024"
          value={pasteValue}
          onChange={e => setPasteValue(e.target.value)}
          style={{ fontFamily: 'monospace', fontSize: '12px' }}
        />
        <Button
          icon={<PlusOutlined />}
          onClick={handlePaste}
          style={{ marginTop: 12, width: '100%' }}
          type="primary"
          size="large"
        >
          Processar Dados Colados
        </Button>
      </Card>

      {eletricistas.length > 0 && (
        <Card
          title={`${eletricistas.length} eletricista(s) pronto(s) para cadastro`}
          size="small"
          style={{ marginBottom: 16 }}
          extra={<Tag color="success">{eletricistas.length}</Tag>}
        >
          <Table
            dataSource={eletricistas}
            columns={columns}
            rowKey={(_, index) => `eletricista-${index}`}
            pagination={false}
            size="small"
            scroll={{ x: 900, y: 300 }}
          />
        </Card>
      )}

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Cadastrar {eletricistas.length > 0 && `(${eletricistas.length})`}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

