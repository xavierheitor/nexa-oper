'use client';

/**
 * Página de Consulta de Checklists
 *
 * Permite buscar e visualizar checklists preenchidos com vários filtros:
 * - Data (período)
 * - Tipo de equipe
 * - Equipe
 * - Placa do veículo
 * - Eletricista
 * - Base
 * - Tipo de checklist
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, DatePicker, Space, Typography, Button, Select, Table, Tag, Row, Col } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { listChecklistsPreenchidos } from '@/lib/actions/checklist/listPreenchidos';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { listBases } from '@/lib/actions/base/list';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import { listEquipes } from '@/lib/actions/equipe/list';
import { listEletricistas } from '@/lib/actions/eletricista/list';
import { listVeiculos } from '@/lib/actions/veiculo/list';
import { listTiposChecklist } from '@/lib/actions/tipoChecklist/list';
import { listChecklists } from '@/lib/actions/checklist/list';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface ChecklistPreenchidoListado {
  id: number;
  uuid: string;
  turnoId: number;
  checklistId: number;
  eletricistaId: number;
  dataPreenchimento: Date | string;
  latitude?: number;
  longitude?: number;
  checklist: {
    id: number;
    nome: string;
    tipoChecklist: {
      id: number;
      nome: string;
    };
  };
  eletricista: {
    id: number;
    nome: string;
    matricula: string;
  };
  turno: {
    id: number;
    equipe: {
      id: number;
      nome: string;
      tipoEquipe: {
        id: number;
        nome: string;
      };
    };
    veiculo: {
      id: number;
      placa: string;
      modelo?: string;
    };
  };
  ChecklistResposta: Array<{
    id: number;
    pergunta: { id: number; nome: string };
    opcaoResposta: { id: number; nome: string; geraPendencia: boolean };
  }>;
}

export default function ConsultaChecklistsPage() {
  const router = useRouter();

  // Estado para o período (padrão: mês atual)
  const [periodo, setPeriodo] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  // Estados para os filtros
  const [tipoEquipeId, setTipoEquipeId] = useState<number | undefined>(undefined);
  const [equipeId, setEquipeId] = useState<number | undefined>(undefined);
  const [veiculoPlaca, setVeiculoPlaca] = useState<string>('');
  const [eletricistaId, setEletricistaId] = useState<number | undefined>(undefined);
  const [baseId, setBaseId] = useState<number | undefined>(undefined);
  const [tipoChecklistId, setTipoChecklistId] = useState<number | undefined>(undefined);
  const [checklistId, setChecklistId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Buscar dados para os selects
  const { data: basesData } = useDataFetch(
    () => unwrapFetcher(listBases)({ page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' }),
    []
  );

  const { data: tiposEquipeData } = useDataFetch(
    () => unwrapFetcher(listTiposEquipe)({ page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' }),
    []
  );

  const { data: equipesData } = useDataFetch(
    () => unwrapFetcher(listEquipes)({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
      ...(tipoEquipeId && { tipoEquipeId }),
    }),
    [tipoEquipeId]
  );

  const { data: eletricistasData } = useDataFetch(
    () => unwrapFetcher(listEletricistas)({ page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' }),
    []
  );

  const { data: veiculosData } = useDataFetch(
    () => unwrapFetcher(listVeiculos)({ page: 1, pageSize: 1000, orderBy: 'placa', orderDir: 'asc' }),
    []
  );

  const { data: tiposChecklistData } = useDataFetch(
    () => unwrapFetcher(listTiposChecklist)({ page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' }),
    []
  );

  const { data: checklistsData } = useDataFetch(
    () => unwrapFetcher(listChecklists)({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
      ...(tipoChecklistId && { tipoChecklistId }),
    }),
    [tipoChecklistId]
  );

  const bases = basesData || [];
  const tiposEquipe = tiposEquipeData || [];
  const equipes = equipesData || [];
  const eletricistas = eletricistasData || [];
  const veiculos = veiculosData || [];
  const tiposChecklist = tiposChecklistData || [];
  const checklists = checklistsData || [];

  // Buscar checklists preenchidos com filtros
  const { data, loading } = useDataFetch<{
    data: ChecklistPreenchidoListado[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>(
    async () => {
      const result = await listChecklistsPreenchidos({
        dataInicio: periodo[0].toDate(),
        dataFim: periodo[1].toDate(),
        ...(tipoEquipeId && { tipoEquipeId }),
        ...(equipeId && { equipeId }),
        ...(veiculoPlaca && { veiculoPlaca }),
        ...(eletricistaId && { eletricistaId }),
        ...(baseId && { baseId }),
        ...(tipoChecklistId && { tipoChecklistId }),
        ...(checklistId && { checklistId }),
        page,
        pageSize,
      });

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar checklists');
    },
    [periodo, tipoEquipeId, equipeId, veiculoPlaca, eletricistaId, baseId, tipoChecklistId, checklistId, page, pageSize]
  );

  const checklistsList = data?.data || [];
  const total = data?.total || 0;

  const handlePeriodoChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setPeriodo([dates[0], dates[1]]);
      setPage(1);
    }
  };

  const handleLimparFiltros = () => {
    setTipoEquipeId(undefined);
    setEquipeId(undefined);
    setVeiculoPlaca('');
    setEletricistaId(undefined);
    setBaseId(undefined);
    setTipoChecklistId(undefined);
    setChecklistId(undefined);
    setPage(1);
  };

  const handleViewChecklist = (checklistId: number) => {
    router.push(`/dashboard/seguranca/consulta-checklists/${checklistId}`);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Data/Hora',
      key: 'dataPreenchimento',
      width: 150,
      render: (record: ChecklistPreenchidoListado) => {
        const date = new Date(record.dataPreenchimento);
        return (
          <div>
            <div>{date.toLocaleDateString('pt-BR')}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Checklist',
      key: 'checklist',
      width: 200,
      render: (record: ChecklistPreenchidoListado) => (
        <div>
          <div>{record.checklist.nome}</div>
          <Tag color="blue">{record.checklist.tipoChecklist.nome}</Tag>
        </div>
      ),
    },
    {
      title: 'Eletricista',
      key: 'eletricista',
      width: 180,
      render: (record: ChecklistPreenchidoListado) => (
        <div>
          <div>{record.eletricista.nome}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>Mat: {record.eletricista.matricula}</div>
        </div>
      ),
    },
    {
      title: 'Equipe',
      key: 'equipe',
      width: 180,
      render: (record: ChecklistPreenchidoListado) => (
        <div>
          <div>{record.turno.equipe.nome}</div>
          <Tag>{record.turno.equipe.tipoEquipe.nome}</Tag>
        </div>
      ),
    },
    {
      title: 'Veículo',
      key: 'veiculo',
      width: 120,
      render: (record: ChecklistPreenchidoListado) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.turno.veiculo.placa}</div>
          {record.turno.veiculo.modelo && (
            <div style={{ fontSize: '12px', color: '#999' }}>{record.turno.veiculo.modelo}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Respostas',
      key: 'respostas',
      width: 100,
      render: (record: ChecklistPreenchidoListado) => (
        <Tag>{record.ChecklistResposta.length} respostas</Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 100,
      fixed: 'right' as const,
      render: (record: ChecklistPreenchidoListado) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewChecklist(record.id)}
        >
          Ver
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Consulta Checklists</Title>

      {/* Filtros */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <RangePicker
                value={periodo}
                onChange={handlePeriodoChange}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Tipo de Equipe"
                allowClear
                style={{ width: '100%' }}
                value={tipoEquipeId}
                onChange={(value) => {
                  setTipoEquipeId(value);
                  setEquipeId(undefined); // Limpar equipe quando mudar tipo
                  setPage(1);
                }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={tiposEquipe.map((tipo: any) => ({
                  value: tipo.id,
                  label: tipo.nome,
                }))}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Equipe"
                allowClear
                style={{ width: '100%' }}
                value={equipeId}
                onChange={(value) => {
                  setEquipeId(value);
                  setPage(1);
                }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={equipes.map((equipe: any) => ({
                  value: equipe.id,
                  label: equipe.nome,
                }))}
                disabled={!tipoEquipeId && tiposEquipe.length > 0}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Placa do Veículo"
                allowClear
                style={{ width: '100%' }}
                value={veiculoPlaca || undefined}
                onChange={(value) => {
                  setVeiculoPlaca(value || '');
                  setPage(1);
                }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={veiculos.map((veiculo: any) => ({
                  value: veiculo.placa,
                  label: `${veiculo.placa}${veiculo.modelo ? ` - ${veiculo.modelo}` : ''}`,
                }))}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Eletricista"
                allowClear
                style={{ width: '100%' }}
                value={eletricistaId}
                onChange={(value) => {
                  setEletricistaId(value);
                  setPage(1);
                }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={eletricistas.map((eletricista: any) => ({
                  value: eletricista.id,
                  label: `${eletricista.nome} (${eletricista.matricula})`,
                }))}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Base"
                allowClear
                style={{ width: '100%' }}
                value={baseId}
                onChange={(value) => {
                  setBaseId(value);
                  setPage(1);
                }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={bases.map((base: any) => ({
                  value: base.id,
                  label: base.nome,
                }))}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Tipo de Checklist"
                allowClear
                style={{ width: '100%' }}
                value={tipoChecklistId}
                onChange={(value) => {
                  setTipoChecklistId(value);
                  setChecklistId(undefined); // Limpar checklist quando mudar tipo
                  setPage(1);
                }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={tiposChecklist.map((tipo: any) => ({
                  value: tipo.id,
                  label: tipo.nome,
                }))}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Checklist"
                allowClear
                style={{ width: '100%' }}
                value={checklistId}
                onChange={(value) => {
                  setChecklistId(value);
                  setPage(1);
                }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={checklists.map((checklist: any) => ({
                  value: checklist.id,
                  label: checklist.nome,
                }))}
                disabled={!tipoChecklistId && tiposChecklist.length > 0}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <Button onClick={handleLimparFiltros}>Limpar Filtros</Button>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Tabela de Checklists */}
      <Card>
        <Table
          columns={columns}
          dataSource={checklistsList}
          loading={loading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (total) => `Total de ${total} checklist(s)`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}

