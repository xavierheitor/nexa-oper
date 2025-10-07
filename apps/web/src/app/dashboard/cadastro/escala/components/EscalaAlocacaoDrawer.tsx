'use client';

/**
 * Drawer para gerenciamento das alocações de eletricistas em uma escala.
 */

import { EscalaWithRelations } from '@/lib/repositories/EscalaRepository';
import {
  EscalaAgenda,
  EscalaAgendaDia,
} from '@/lib/services/EscalaService';
import dayjs from 'dayjs';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Empty,
  Form,
  InputNumber,
  List,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

const { Text, Title } = Typography;

interface EletricistaOption {
  id: number;
  nome: string;
  matricula: string;
}

interface AllocationFormItem {
  eletricistaId: number;
  ordemRotacao: number;
  vigenciaInicio?: dayjs.Dayjs | null;
  vigenciaFim?: dayjs.Dayjs | null;
  ativo: boolean;
}

interface HorarioAllocationFormValues {
  alocacoes: AllocationFormItem[];
}

interface EscalaAlocacaoDrawerProps {
  open: boolean;
  escala: EscalaWithRelations | null;
  eletricistas: EletricistaOption[];
  eletricistasLoading?: boolean;
  onClose: () => void;
  onAssign: (
    escalaId: number,
    horarioId: number,
    allocations: Array<{
      eletricistaId: number;
      ordemRotacao: number;
      vigenciaInicio?: string | null;
      vigenciaFim?: string | null;
      ativo: boolean;
    }>
  ) => Promise<void>;
  agenda?: EscalaAgenda | null;
  agendaLoading?: boolean;
  onGenerateAgenda?: (range: { dataInicio?: string; dataFim?: string }) => Promise<void>;
}

const AllocationModal: React.FC<{
  open: boolean;
  onClose: () => void;
  horario: EscalaWithRelations['horarios'][number] | null;
  onSubmit: (items: HorarioAllocationFormValues['alocacoes']) => Promise<void>;
  eletricistas: EletricistaOption[];
  loading?: boolean;
}> = ({ open, onClose, horario, onSubmit, eletricistas, loading }) => {
  const [form] = Form.useForm<HorarioAllocationFormValues>();

  const initialValues = useMemo<HorarioAllocationFormValues>(() => {
    if (!horario) {
      return { alocacoes: [] };
    }

    return {
      alocacoes: horario.alocacoes.map(item => ({
        eletricistaId: item.eletricista.id,
        ordemRotacao: item.ordemRotacao,
        vigenciaInicio: item.vigenciaInicio ? dayjs(item.vigenciaInicio) : null,
        vigenciaFim: item.vigenciaFim ? dayjs(item.vigenciaFim) : null,
        ativo: item.ativo,
      })),
    };
  }, [horario]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Alocações - ${horario?.etiqueta ?? `Dia ${horario?.indiceCiclo ?? ''}`}`}
      onOk={async () => {
        const values = await form.validateFields();
        await onSubmit(values.alocacoes);
      }}
      okButtonProps={{ loading }}
      destroyOnClose
    >
      <Form form={form} layout='vertical' initialValues={initialValues}>
        <Form.List name='alocacoes'>
          {(fields, { add, remove }) => (
            <Space direction='vertical' className='w-full'>
              {fields.map(field => (
                <Card key={field.key} size='small'>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item
                        name={[field.name, 'eletricistaId']}
                        label='Eletricista'
                        rules={[{ required: true, message: 'Selecione o eletricista' }]}
                      >
                        <Select
                          showSearch
                          optionFilterProp='label'
                          placeholder='Selecione o eletricista'
                          options={eletricistas.map(item => ({
                            label: `${item.nome} (${item.matricula})`,
                            value: item.id,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name={[field.name, 'ordemRotacao']}
                        label='Ordem'
                        rules={[{ required: true, message: 'Informe a ordem' }]}
                      >
                        <InputNumber min={0} className='w-full' />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name={[field.name, 'ativo']}
                        label='Ativo'
                        valuePropName='checked'
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name={[field.name, 'vigenciaInicio']} label='Início'>
                        <DatePicker format='YYYY-MM-DD' className='w-full' />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name={[field.name, 'vigenciaFim']} label='Fim'>
                        <DatePicker format='YYYY-MM-DD' className='w-full' />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Button danger type='link' onClick={() => remove(field.name)}>
                    Remover eletricista
                  </Button>
                </Card>
              ))}

              <Button
                type='dashed'
                onClick={() =>
                  add({
                    eletricistaId: undefined,
                    ordemRotacao: fields.length,
                    vigenciaInicio: null,
                    vigenciaFim: null,
                    ativo: true,
                  })
                }
                block
              >
                Adicionar eletricista
              </Button>
            </Space>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

const AgendaPreview: React.FC<{ agenda: EscalaAgenda | null; loading?: boolean }> = ({
  agenda,
  loading,
}) => {
  if (loading) {
    return <Card loading style={{ marginTop: 16 }} />;
  }

  if (!agenda) {
    return (
      <Card style={{ marginTop: 16 }}>
        <Empty description='Gere a agenda para visualizar a rotação' />
      </Card>
    );
  }

  return (
    <Card style={{ marginTop: 16 }} title='Agenda prevista'>
      <List
        dataSource={agenda.dias}
        renderItem={(dia: EscalaAgendaDia) => (
          <List.Item>
            <Space direction='vertical'>
              <Text strong>{dayjs(dia.data).format('DD/MM/YYYY')} · Ciclo #{dia.indiceCiclo}</Text>
              {dia.slots.map(slot => (
                <div key={slot.horario.id}>
                  <Text type='secondary'>
                    {slot.horario.etiqueta ?? `Horário ${slot.horario.indiceCiclo}`} · Necessários:
                    {` ${slot.horario.eletricistasNecessarios}`}
                  </Text>
                  <Space wrap>
                    {slot.eletricistas.map(eletricista => (
                      <Tag
                        key={`${slot.horario.id}-${eletricista.id}`}
                        color={eletricista.escalado ? 'green' : 'default'}
                      >
                        {eletricista.nome}
                      </Tag>
                    ))}
                  </Space>
                </div>
              ))}
            </Space>
          </List.Item>
        )}
      />
    </Card>
  );
};

const EscalaAlocacaoDrawer: React.FC<EscalaAlocacaoDrawerProps> = ({
  open,
  escala,
  eletricistas,
  eletricistasLoading,
  onClose,
  onAssign,
  agenda,
  agendaLoading,
  onGenerateAgenda,
}) => {
  const [modalHorario, setModalHorario] = useState<EscalaWithRelations['horarios'][number] | null>(
    null
  );
  const [modalLoading, setModalLoading] = useState(false);
  const [agendaRange, setAgendaRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    null,
    null,
  ]);

  useEffect(() => {
    setAgendaRange([null, null]);
  }, [escala?.id]);

  if (!escala) {
    return null;
  }

  const handleSubmitHorario = async (items: HorarioAllocationFormValues['alocacoes']) => {
    if (!modalHorario) {
      return;
    }
    setModalLoading(true);
    try {
      await onAssign(
        escala.id,
        modalHorario.id,
        items.map(item => ({
          eletricistaId: item.eletricistaId,
          ordemRotacao: item.ordemRotacao,
          vigenciaInicio: item.vigenciaInicio ? item.vigenciaInicio.toISOString() : null,
          vigenciaFim: item.vigenciaFim ? item.vigenciaFim.toISOString() : null,
          ativo: item.ativo,
        }))
      );
      setModalHorario(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleGenerateAgenda = async () => {
    if (!onGenerateAgenda) {
      return;
    }
    await onGenerateAgenda({
      dataInicio: agendaRange[0]?.toISOString(),
      dataFim: agendaRange[1]?.toISOString(),
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={720}
      title={`Alocações - ${escala.nome}`}
    >
      <Space direction='vertical' style={{ width: '100%' }} size='large'>
        <Card>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Contrato</Text>
              <br />
              <Text>{escala.contrato.nome}</Text>
            </Col>
            <Col span={12}>
              <Text strong>Dias do ciclo</Text>
              <br />
              <Text>{escala.diasCiclo}</Text>
            </Col>
          </Row>
        </Card>

        <Card
          title='Horários cadastrados'
          extra={
            <Text type='secondary'>
              {eletricistasLoading
                ? 'Carregando eletricistas...'
                : `${eletricistas.length} eletricistas disponíveis`}
            </Text>
          }
        >
          {escala.horarios.length === 0 ? (
            <Empty description='Cadastre horários na edição da escala' />
          ) : (
            <Space direction='vertical' className='w-full'>
              {escala.horarios.map(horario => (
                <Card key={horario.id} size='small'>
                  <Space direction='vertical' className='w-full'>
                    <Space>
                      <Title level={5} style={{ margin: 0 }}>
                        {horario.etiqueta ?? `Índice ${horario.indiceCiclo}`}
                      </Title>
                      <Tag>{`Necessita ${horario.eletricistasNecessarios}`}</Tag>
                      {horario.folga && <Tag color='purple'>Folga</Tag>}
                    </Space>
                    <Space wrap>
                      {horario.alocacoes.length === 0 ? (
                        <Text type='secondary'>Nenhum eletricista vinculado.</Text>
                      ) : (
                        horario.alocacoes.map(alocacao => (
                          <Tag key={alocacao.id} color={alocacao.ativo ? 'blue' : 'default'}>
                            {alocacao.eletricista.nome} · Ordem {alocacao.ordemRotacao}
                          </Tag>
                        ))
                      )}
                    </Space>
                    <Button type='primary' onClick={() => setModalHorario(horario)}>
                      Gerenciar eletricistas
                    </Button>
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </Card>

        <Card title='Gerar agenda'>
          <Space direction='vertical' className='w-full'>
            <Text>Selecione o período desejado para visualizar a rotação prevista.</Text>
            <DatePicker.RangePicker
              value={agendaRange}
              onChange={values => setAgendaRange(values ?? [null, null])}
              format='YYYY-MM-DD'
            />
            <Button type='primary' onClick={handleGenerateAgenda} disabled={!onGenerateAgenda}>
              Gerar agenda
            </Button>
          </Space>
        </Card>

        <AgendaPreview agenda={agenda ?? null} loading={agendaLoading} />
      </Space>

      <AllocationModal
        open={Boolean(modalHorario)}
        horario={modalHorario}
        onClose={() => setModalHorario(null)}
        eletricistas={eletricistas}
        onSubmit={handleSubmitHorario}
        loading={modalLoading}
      />
    </Drawer>
  );
};

export default EscalaAlocacaoDrawer;
