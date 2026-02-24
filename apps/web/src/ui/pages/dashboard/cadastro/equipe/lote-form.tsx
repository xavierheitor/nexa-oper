/**
 * Formulário de Cadastro em Lote de Equipes
 *
 * Permite cadastrar múltiplas equipes de uma vez colando dados do Excel
 */

'use client';

import { useState } from 'react';
import { Button, Card, Form, Input, Space, Table, Typography, Select, App } from 'antd';
import { createEquipesLote } from '@/lib/actions/equipe/createLote';
import { EquipeLoteItem } from '@/lib/schemas/equipeSchema';

const { Text } = Typography;

interface LinhaEquipe extends EquipeLoteItem {
  key: string;
}

interface Props {
  contratos: Array<{ id: number; nome: string }>;
  tiposEquipe: Array<{ id: number; nome: string }>;
  onSuccess?: () => void;
}

export default function EquipeLoteForm({ contratos, tiposEquipe, onSuccess }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState<LinhaEquipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [contratoId, setContratoId] = useState<number | undefined>();
  const [tipoEquipeId, setTipoEquipeId] = useState<number | undefined>();

  const columns = [
    {
      title: 'Nome da Equipe',
      dataIndex: 'nome',
      render: (text: string, record: LinhaEquipe, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(e.target.value, index, 'nome')}
          placeholder="Ex: Manutenção A, Equipe Norte..."
          status={!text ? 'error' : ''}
        />
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: LinhaEquipe, index: number) => (
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

  const handleInputChange = (value: string, index: number, field: keyof LinhaEquipe) => {
    const newData = [...dataSource];
    newData[index][field] = value as any;
    setDataSource(newData);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedData = event.clipboardData.getData('Text');
    const linhas = pastedData.trim().split(/\r?\n/);

    const novasLinhas = linhas.map((linha, index) => {
      // Aceita tanto uma coluna (só nome) quanto múltiplas colunas separadas por TAB
      const nome = linha.split('\t')[0]?.trim() ?? '';
      return {
        key: Date.now().toString() + index,
        nome,
      };
    });

    setDataSource((prev) => [...prev, ...novasLinhas]);
    message.success(`${novasLinhas.length} linha(s) colada(s)`);
  };

  const handleSubmit = async () => {
    if (!contratoId || !tipoEquipeId) {
      message.error('Selecione Contrato e Tipo de Equipe');
      return;
    }

    if (dataSource.length === 0) {
      message.error('Adicione pelo menos uma equipe');
      return;
    }

    // Validar dados
    const invalido = dataSource.find((e) => !e.nome);
    if (invalido) {
      message.error('Há nomes vazios. Verifique os campos destacados em vermelho.');
      return;
    }

    try {
      setLoading(true);
      const result = await createEquipesLote({
        contratoId,
        tipoEquipeId,
        equipes: dataSource,
      });

      if (result.success && result.data) {
        message.success(`${result.data.equipesCriadas} equipe(s) cadastrada(s) com sucesso!`);
        setDataSource([]);
        form.resetFields();
        onSuccess?.();
      } else {
        message.error(result.error || 'Erro ao cadastrar equipes');
      }
    } catch (err) {
      console.error(err);
      message.error('Erro ao cadastrar equipes');
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
      title="Cadastro de Equipes em Lote"
      extra={
        <Space>
          <Button
            onClick={() =>
              setDataSource((prev) => [
                ...prev,
                {
                  key: Date.now().toString(),
                  nome: '',
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
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
              options={contratos.map((c) => ({
                value: c.id,
                label: c.nome,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Tipo de Equipe"
            required
            style={{ marginBottom: 8 }}
          >
            <Select
              placeholder="Selecione o tipo"
              value={tipoEquipeId}
              onChange={setTipoEquipeId}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
              options={tiposEquipe.map((t) => ({
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
            Clique aqui e pressione <strong>CTRL + V</strong> para colar os nomes das equipes
            <br />
            <small>Formato: Um nome por linha (ex: Manutenção A, Equipe Norte, etc)</small>
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
            <Text strong>Total: {dataSource.length} equipe(s)</Text>
          </div>
        )}

        <Form.Item style={{ marginTop: 20, marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={dataSource.length === 0 || !contratoId || !tipoEquipeId}
          >
            Salvar Todas ({dataSource.length})
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

