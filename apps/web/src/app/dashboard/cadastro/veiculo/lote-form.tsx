/**
 * Formulário de Cadastro em Lote de Veículos
 *
 * Permite cadastrar múltiplos veículos de uma vez colando dados do Excel
 */

'use client';

import { useState } from 'react';
import { Button, Card, Form, Input, Space, Table, Typography, message, Select } from 'antd';
import { createVeiculosLote } from '@/lib/actions/veiculo/createLote';
import { VeiculoLoteItem } from '@/lib/schemas/veiculoSchema';

const { Text } = Typography;

interface LinhaVeiculo extends VeiculoLoteItem {
  key: string;
}

interface Props {
  contratos: Array<{ id: number; nome: string }>;
  bases: Array<{ id: number; nome: string }>;
  tiposVeiculo: Array<{ id: number; nome: string }>;
  onSuccess?: () => void;
}

export default function VeiculoLoteForm({ contratos, bases, tiposVeiculo, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState<LinhaVeiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [contratoId, setContratoId] = useState<number | undefined>();
  const [baseId, setBaseId] = useState<number | undefined>();
  const [tipoVeiculoId, setTipoVeiculoId] = useState<number | undefined>();

  const columns = [
    {
      title: 'Placa',
      dataIndex: 'placa',
      width: 150,
      render: (text: string, record: LinhaVeiculo, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(e.target.value, index, 'placa')}
          placeholder="ABC1D23"
          status={!text ? 'error' : ''}
        />
      ),
    },
    {
      title: 'Modelo',
      dataIndex: 'modelo',
      render: (text: string, record: LinhaVeiculo, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(e.target.value, index, 'modelo')}
          placeholder="Hilux, Caminhão, etc"
          status={!text ? 'error' : ''}
        />
      ),
    },
    {
      title: 'Ano',
      dataIndex: 'ano',
      width: 120,
      render: (text: number, record: LinhaVeiculo, index: number) => (
        <Input
          type="number"
          value={text}
          onChange={(e) => handleInputChange(Number(e.target.value), index, 'ano')}
          placeholder="2024"
          status={!text || text < 1900 ? 'error' : ''}
        />
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: LinhaVeiculo, index: number) => (
        <Button
          danger
          size="small"
          onClick={() => {
            const newData = dataSource.filter((_, i) => i !== index);
            setDataSource(newData);
          }}
        >
          Remover
        </Button>
      ),
    },
  ];

  const handleInputChange = (value: string | number, index: number, field: keyof LinhaVeiculo) => {
    const newData = [...dataSource];
    newData[index][field] = value as any;
    setDataSource(newData);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedData = event.clipboardData.getData('Text');
    const linhas = pastedData.trim().split(/\r?\n/);

    const novasLinhas = linhas.map((linha, index) => {
      const colunas = linha.split('\t');
      return {
        key: Date.now().toString() + index,
        placa: colunas[0]?.trim().toUpperCase() ?? '',
        modelo: colunas[1]?.trim() ?? '',
        ano: parseInt(colunas[2]?.trim() ?? '0') || new Date().getFullYear(),
      };
    });

    setDataSource((prev) => [...prev, ...novasLinhas]);
    message.success(`${novasLinhas.length} linha(s) colada(s)`);
  };

  const handleSubmit = async () => {
    if (!contratoId || !baseId || !tipoVeiculoId) {
      message.error('Selecione Contrato, Base e Tipo de Veículo');
      return;
    }

    if (dataSource.length === 0) {
      message.error('Adicione pelo menos um veículo');
      return;
    }

    // Validar dados
    const invalido = dataSource.find(
      (v) => !v.placa || !v.modelo || !v.ano || v.ano < 1900
    );
    if (invalido) {
      message.error('Há valores inválidos. Verifique os campos destacados em vermelho.');
      return;
    }

    try {
      setLoading(true);
      const result = await createVeiculosLote({
        contratoId,
        baseId,
        tipoVeiculoId,
        veiculos: dataSource,
      });

      if (result.success && result.data) {
        message.success(`${result.data.veiculosCriados} veículo(s) cadastrado(s) com sucesso!`);
        setDataSource([]);
        form.resetFields();
        onSuccess?.();
      } else {
        message.error(result.error || 'Erro ao cadastrar veículos');
      }
    } catch (err) {
      console.error(err);
      message.error('Erro ao cadastrar veículos');
    } finally {
      setLoading(false);
    }
  };

  const resetarTudo = () => {
    setDataSource([]);
    form.resetFields();
  };

  return (
    <Card
      title="Cadastro de Veículos em Lote"
      extra={
        <Space>
          <Button
            onClick={() =>
              setDataSource((prev) => [
                ...prev,
                {
                  key: Date.now().toString(),
                  placa: '',
                  modelo: '',
                  ano: new Date().getFullYear(),
                },
              ])
            }
          >
            Adicionar Linha
          </Button>
          <Button danger onClick={resetarTudo}>
            Resetar Tudo
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <Form.Item
            label="Contrato"
            required
            style={{ marginBottom: 8 }}
          >
            <Select
              placeholder="Selecione o contrato"
              value={contratoId}
              onChange={setContratoId}
              showSearch
              optionFilterProp="children"
              options={contratos.map((c) => ({
                value: c.id,
                label: c.nome,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Base"
            required
            style={{ marginBottom: 8 }}
          >
            <Select
              placeholder="Selecione a base"
              value={baseId}
              onChange={setBaseId}
              showSearch
              optionFilterProp="children"
              options={bases.map((b) => ({
                value: b.id,
                label: b.nome,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Tipo de Veículo"
            required
            style={{ marginBottom: 8 }}
          >
            <Select
              placeholder="Selecione o tipo"
              value={tipoVeiculoId}
              onChange={setTipoVeiculoId}
              showSearch
              optionFilterProp="children"
              options={tiposVeiculo.map((t) => ({
                value: t.id,
                label: t.nome,
              }))}
            />
          </Form.Item>
        </Space>

        <div
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          tabIndex={0}
          style={{
            border: isFocused ? '2px solid #1677ff' : '1px dashed #d9d9d9',
            padding: 8,
            marginBottom: 12,
            cursor: 'text',
            borderRadius: 6,
            minHeight: 40,
            outline: 'none',
            background: isFocused ? '#e6f4ff' : 'white',
            transition: 'all 0.2s ease',
          }}
        >
          <Text type="secondary">
            Clique aqui e pressione <strong>CTRL + V</strong> para colar os dados do Excel
            <br />
            <small>Formato: Placa [TAB] Modelo [TAB] Ano (uma linha por veículo)</small>
          </Text>
        </div>

        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          size="small"
          bordered
        />

        {dataSource.length > 0 && (
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <Text strong>Total: {dataSource.length} veículo(s)</Text>
          </div>
        )}

        <Form.Item style={{ marginTop: 20, marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={dataSource.length === 0 || !contratoId || !baseId || !tipoVeiculoId}
          >
            Salvar Todos ({dataSource.length})
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

