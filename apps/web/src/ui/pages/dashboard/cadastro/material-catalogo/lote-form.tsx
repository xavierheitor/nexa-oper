'use client';

import { createMateriaisCatalogoLote } from '@/lib/actions/materialCatalogo/createLote';
import { MaterialCatalogoLoteItem } from '@/lib/schemas/materialCatalogoSchema';
import { App, Button, Card, Form, Input, Select, Space, Table, Typography } from 'antd';
import { useState } from 'react';

const { Text } = Typography;

interface LinhaMaterial extends MaterialCatalogoLoteItem {
  key: string;
}

interface ContratoOption {
  id: number;
  nome: string;
  numero?: string;
}

interface Props {
  contratos: ContratoOption[];
  onSuccess?: () => void;
}

export default function MaterialCatalogoLoteForm({ contratos, onSuccess }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState<LinhaMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [contratoId, setContratoId] = useState<number | undefined>();

  const handleInputChange = (
    value: string,
    index: number,
    field: 'codigo' | 'descricao' | 'unidadeMedida'
  ) => {
    const newData = [...dataSource];
    newData[index][field] = value;
    setDataSource(newData);
  };

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      width: 160,
      render: (text: string, _record: LinhaMaterial, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(e.target.value, index, 'codigo')}
          placeholder='Código'
          status={!text ? 'error' : ''}
        />
      ),
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      render: (text: string, _record: LinhaMaterial, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(e.target.value, index, 'descricao')}
          placeholder='Descrição do material'
          status={!text ? 'error' : ''}
        />
      ),
    },
    {
      title: 'Unidade',
      dataIndex: 'unidadeMedida',
      width: 150,
      render: (text: string, _record: LinhaMaterial, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(e.target.value, index, 'unidadeMedida')}
          placeholder='UN, KG, M, CX...'
          status={!text ? 'error' : ''}
        />
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 100,
      render: (_: unknown, _record: LinhaMaterial, index: number) => (
        <Button
          danger
          size='small'
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

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedData = event.clipboardData.getData('Text');
    const linhas = pastedData.trim().split(/\r?\n/);

    const novasLinhas = linhas.map((linha, index) => {
      const colunas = linha.split('\t');
      return {
        key: `${Date.now()}-${index}`,
        codigo: colunas[0]?.trim() ?? '',
        descricao: colunas[1]?.trim() ?? '',
        unidadeMedida: colunas[2]?.trim() ?? '',
      };
    });

    setDataSource((prev) => [...prev, ...novasLinhas]);
    message.success(`${novasLinhas.length} linha(s) colada(s)`);
  };

  const handleSubmit = async () => {
    if (!contratoId) {
      message.error('Selecione o contrato');
      return;
    }

    if (dataSource.length === 0) {
      message.error('Adicione pelo menos um material');
      return;
    }

    const invalido = dataSource.find(
      (item) => !item.codigo || !item.descricao || !item.unidadeMedida
    );
    if (invalido) {
      message.error('Há campos obrigatórios vazios na grade.');
      return;
    }

    try {
      setLoading(true);
      const result = await createMateriaisCatalogoLote({
        contratoId,
        materiais: dataSource,
      });

      if (result.success && result.data) {
        message.success(
          `${result.data.materiaisCriados} material(is) cadastrado(s) com sucesso!`
        );
        setDataSource([]);
        form.resetFields();
        onSuccess?.();
        return;
      }

      message.error(result.error || 'Erro ao cadastrar materiais');
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
      title='Cadastro de Materiais em Lote'
      extra={
        <Space>
          <Button
            onClick={() =>
              setDataSource((prev) => [
                ...prev,
                {
                  key: Date.now().toString(),
                  codigo: '',
                  descricao: '',
                  unidadeMedida: '',
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
      <Form form={form} layout='vertical' onFinish={handleSubmit}>
        <Form.Item label='Contrato' required style={{ marginBottom: 8 }}>
          <Select
            placeholder='Selecione o contrato'
            value={contratoId}
            onChange={setContratoId}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            options={contratos.map((contrato) => ({
              value: contrato.id,
              label: contrato.numero
                ? `${contrato.nome} (${contrato.numero})`
                : contrato.nome,
            }))}
          />
        </Form.Item>

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
          <Text type='secondary'>
            Clique aqui e pressione <strong>CTRL + V</strong> para colar os dados do Excel
            <br />
            <small>
              Formato: Código [TAB] Descrição [TAB] Unidade (uma linha por material)
            </small>
          </Text>
        </div>

        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          rowKey='key'
          scroll={{ x: 'max-content' }}
          size='small'
          bordered
        />

        {dataSource.length > 0 && (
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <Text strong>Total: {dataSource.length} material(is)</Text>
          </div>
        )}

        <Form.Item style={{ marginTop: 20, marginBottom: 0 }}>
          <Button
            type='primary'
            htmlType='submit'
            loading={loading}
            disabled={dataSource.length === 0 || !contratoId}
          >
            Salvar Todos ({dataSource.length})
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
