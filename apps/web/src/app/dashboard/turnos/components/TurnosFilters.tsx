import React from 'react';
import { Row, Col, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface TurnosFiltersProps {
  filtroVeiculo: string;
  setFiltroVeiculo: (value: string) => void;
  filtroEquipe: string;
  setFiltroEquipe: (value: string) => void;
  filtroEletricista: string;
  setFiltroEletricista: (value: string) => void;
  filtroBase: string | undefined;
  setFiltroBase: (value: string | undefined) => void;
  filtroTipoEquipe: string | undefined;
  setFiltroTipoEquipe: (value: string | undefined) => void;
  basesData: Array<{ id: number; nome: string }> | undefined;
  loadingBases: boolean;
  tiposEquipeData: Array<{ id: number; nome: string }> | undefined;
  loadingTiposEquipe: boolean;
}

export const TurnosFilters: React.FC<TurnosFiltersProps> = ({
  filtroVeiculo,
  setFiltroVeiculo,
  filtroEquipe,
  setFiltroEquipe,
  filtroEletricista,
  setFiltroEletricista,
  filtroBase,
  setFiltroBase,
  filtroTipoEquipe,
  setFiltroTipoEquipe,
  basesData,
  loadingBases,
  tiposEquipeData,
  loadingTiposEquipe,
}) => {
  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} md={4}>
        <Input
          placeholder='Veículo'
          prefix={<SearchOutlined />}
          value={filtroVeiculo}
          onChange={e => setFiltroVeiculo(e.target.value)}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} md={4}>
        <Input
          placeholder='Equipe'
          prefix={<SearchOutlined />}
          value={filtroEquipe}
          onChange={e => setFiltroEquipe(e.target.value)}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} md={4}>
        <Input
          placeholder='Eletricista'
          prefix={<SearchOutlined />}
          value={filtroEletricista}
          onChange={e => setFiltroEletricista(e.target.value)}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Select
          placeholder='Base'
          style={{ width: '100%' }}
          value={filtroBase}
          onChange={setFiltroBase}
          allowClear
          showSearch
          optionFilterProp='children'
          loading={loadingBases}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={basesData?.map(base => ({
            label: base.nome,
            value: base.nome,
          }))}
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Select
          placeholder='Tipo de Equipe'
          style={{ width: '100%' }}
          value={filtroTipoEquipe}
          onChange={setFiltroTipoEquipe}
          allowClear
          showSearch
          optionFilterProp='children'
          loading={loadingTiposEquipe}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={tiposEquipeData?.map(tipo => ({
            label: tipo.nome,
            value: tipo.nome,
          }))}
        />
      </Col>
    </Row>
  );
};
