'use client';

import { setAprTipoAtividade } from '@/lib/actions/aprVinculo/tipoAtividade/set';
import { listAprs } from '@/lib/actions/apr/list';
import { listTiposAtividade } from '@/lib/actions/tipoAtividade/list';
import { AprTipoAtividadeRelacao } from '@nexa-oper/db';
import type { CrudController } from '@/lib/hooks/useCrudController';
import { Button, Form, Select, Spin, App, message } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

interface AprVinculoModalProps {
  onSaved: () => void;
  controllerExec: CrudController<unknown>['exec'];
}

/**
 * Componente Modal para Vinculação APR-TipoAtividade
 *
 * Modal específico para criar vínculos entre APRs e Tipos de Atividade.
 * Carrega dados necessários (APRs e Tipos de Atividade) e permite
 * seleção via dropdowns com busca.
 */
export function AprVinculoModal({
  onSaved,
  controllerExec
}: AprVinculoModalProps) {
  const { message: messageApi } = App.useApp();
  // Estado local do formulário
  const [form] = Form.useForm();

  /**
   * Carrega dados necessários para os dropdowns
   *
   * Executa chamadas paralelas para buscar APRs e Tipos de Atividade
   * disponíveis para vinculação. Trata erros e gerencia estado de loading.
   */
  const { data: dadosVinculo, loading } = useDataFetch(
    async () => {
      // Busca paralela de APRs e Tipos de Atividade
      const [aprsResult, tiposResult] = await Promise.all([
        listAprs({
          page: 1,
          pageSize: 200,
          orderBy: 'nome',
          orderDir: 'asc'
        }),
        listTiposAtividade({
          page: 1,
          pageSize: 200,
          orderBy: 'nome',
          orderDir: 'asc'
        }),
      ]);

      if (aprsResult.success && aprsResult.data && tiposResult.success && tiposResult.data) {
        return {
          aprs: aprsResult.data.data || [],
          tipos: tiposResult.data.data || [],
        };
      }
      throw new Error('Erro ao carregar dados para vinculação');
    },
    [],
    {
      onError: () => {
        messageApi.error('Erro ao carregar dados para vinculação');
      }
    }
  );

  const tipos = dadosVinculo?.tipos || [];
  const aprsData = dadosVinculo?.aprs || [];

  // Exibe loading enquanto carrega dados
  if (loading) {
    return <Spin spinning style={{ width: '100%', padding: '40px 0' }} />;
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values: { aprId: number; tipoAtividadeId: number }) =>
        controllerExec(
          () => setAprTipoAtividade(values),
          'Vínculo salvo com sucesso!'
        ).finally(onSaved)
      }
    >
      {/* Seleção de Tipo de Atividade */}
      <Form.Item
        name="tipoAtividadeId"
        label="Tipo de Atividade"
        rules={[{ required: true, message: 'Selecione um tipo de atividade' }]}
      >
        <Select
          showSearch
          placeholder="Selecione o tipo de atividade"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={tipos.map(tipo => ({
            value: tipo.id,
            label: tipo.nome
          }))}
        />
      </Form.Item>

      {/* Seleção de APR */}
      <Form.Item
        name="aprId"
        label="APR"
        rules={[{ required: true, message: 'Selecione uma APR' }]}
      >
        <Select
          showSearch
          placeholder="Selecione a APR"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={aprsData.map(apr => ({
            value: apr.id,
            label: apr.nome
          }))}
        />
      </Form.Item>

      {/* Botão de submit */}
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Salvar Vínculo
        </Button>
      </Form.Item>
    </Form>
  );
}

