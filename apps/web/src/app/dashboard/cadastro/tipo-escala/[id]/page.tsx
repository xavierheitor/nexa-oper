/**
 * Página de Edição Detalhada de Tipo de Escala
 *
 * Permite configurar as posições do ciclo ou máscaras de semana
 */

'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { Card, Tabs, Button, Tag, Space, Row, Col, Switch, Spin, App } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { getTipoEscalaById, salvarPosicoesCiclo } from '@/lib/actions/escala/tipoEscala';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

interface TipoEscalaWithRelations {
  id: number;
  nome: string;
  modoRepeticao: string;
  cicloDias: number | null;
  periodicidadeSemanas: number | null;
  ativo: boolean;
  observacoes: string | null;
  eletricistasPorTurma: number | null;
  CicloPosicoes?: Array<{
    id: number;
    posicao: number;
    status: string;
  }>;
  SemanaMascaras?: Array<{
    id: number;
    semanaIndex: number;
    dia: string;
    status: string;
  }>;
}

const DiaSemanaLabels = {
  SEGUNDA: 'Segunda',
  TERCA: 'Terça',
  QUARTA: 'Quarta',
  QUINTA: 'Quinta',
  SEXTA: 'Sexta',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

export default function TipoEscalaDetailPage({ params }: Props) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [tipoEscala, setTipoEscala] = useState<TipoEscalaWithRelations | null>(null);
  const [cicloPosicoes, setCicloPosicoes] = useState<{ posicao: number; status: string }[]>([]);
  const [semanaMascaras, setSemanaMascaras] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTipoEscalaById(Number(resolvedParams.id));
      if (result.success && result.data) {
        const tipoEscalaData = result.data as TipoEscalaWithRelations;
        setTipoEscala(tipoEscalaData);

        // Inicializar posições do ciclo
        if (tipoEscalaData.modoRepeticao === 'CICLO_DIAS' && tipoEscalaData.cicloDias) {
          const posicoes = tipoEscalaData.CicloPosicoes || [];
          const posicoesCompletas = [];

          for (let i = 0; i < tipoEscalaData.cicloDias; i++) {
            const existente = posicoes.find((p: any) => p.posicao === i);
            posicoesCompletas.push({
              posicao: i,
              status: existente?.status || 'TRABALHO',
              id: existente?.id,
            });
          }

          setCicloPosicoes(posicoesCompletas);
        }

        // Inicializar máscaras de semana
        if (tipoEscalaData.modoRepeticao === 'SEMANA_DEPENDENTE') {
          setSemanaMascaras(tipoEscalaData.SemanaMascaras || []);
        }
      }
    } catch (error) {
      message.error('Erro ao carregar tipo de escala');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id, message]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTogglePosicao = (posicao: number) => {
    setCicloPosicoes(prev =>
      prev.map(p =>
        p.posicao === posicao
          ? { ...p, status: p.status === 'TRABALHO' ? 'FOLGA' : 'TRABALHO' }
          : p
      )
    );
  };

  const handleSavePosicoes = async () => {
    if (!tipoEscala) return;

    try {
      const result = await salvarPosicoesCiclo({
        tipoEscalaId: tipoEscala.id,
        posicoes: cicloPosicoes.map(p => ({
          posicao: p.posicao,
          status: p.status,
        })),
      });

      if (result.success) {
        message.success('Posições do ciclo salvas com sucesso!');
        // Recarrega os dados para pegar os IDs criados
        await loadData();
      } else {
        message.error(result.error || 'Erro ao salvar posições');
      }
    } catch (error) {
      message.error('Erro ao salvar posições do ciclo');
      console.error('Erro:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!tipoEscala) {
    return (
      <div style={{ padding: '24px' }}>
        <p>Tipo de escala não encontrado</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: 16 }}
      >
        Voltar
      </Button>

      <Card
        title={
          <Space>
            <span>{tipoEscala.nome}</span>
            <Tag color="blue">
              {tipoEscala.modoRepeticao === 'CICLO_DIAS' ? 'Ciclo de Dias' : 'Semana Dependente'}
            </Tag>
          </Space>
        }
        extra={
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSavePosicoes}>
            Salvar Configurações
          </Button>
        }
      >
        <Tabs
          items={[
            {
              key: 'info',
              label: 'Informações Gerais',
              children: (
                <div>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <strong>Nome:</strong> {tipoEscala.nome}
                    </Col>
                    <Col span={12}>
                      <strong>Modo:</strong>{' '}
                      {tipoEscala.modoRepeticao === 'CICLO_DIAS' ? 'Ciclo de Dias' : 'Semana Dependente'}
                    </Col>
                    {tipoEscala.cicloDias && (
                      <Col span={12}>
                        <strong>Dias no Ciclo:</strong> {tipoEscala.cicloDias}
                      </Col>
                    )}
                    {tipoEscala.periodicidadeSemanas && (
                      <Col span={12}>
                        <strong>Periodicidade:</strong> {tipoEscala.periodicidadeSemanas} semanas
                      </Col>
                    )}
                    {tipoEscala.eletricistasPorTurma && (
                      <Col span={12}>
                        <strong>Eletricistas por Turma:</strong> {tipoEscala.eletricistasPorTurma}
                      </Col>
                    )}
                    <Col span={12}>
                      <strong>Ativo:</strong>{' '}
                      <Tag color={tipoEscala.ativo ? 'green' : 'red'}>
                        {tipoEscala.ativo ? 'Sim' : 'Não'}
                      </Tag>
                    </Col>
                    {tipoEscala.observacoes && (
                      <Col span={24}>
                        <strong>Observações:</strong>
                        <p>{tipoEscala.observacoes}</p>
                      </Col>
                    )}
                  </Row>
                </div>
              ),
            },
            ...(tipoEscala.modoRepeticao === 'CICLO_DIAS'
              ? [
                  {
                    key: 'ciclo',
                    label: `Configurar Ciclo (${tipoEscala.cicloDias} dias)`,
                    children: (
                      <div>
                        <p style={{ marginBottom: 16 }}>
                          Configure quais dias do ciclo são de <Tag color="green">TRABALHO</Tag> e
                          quais são de <Tag color="red">FOLGA</Tag>:
                        </p>

                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          {cicloPosicoes.map((pos) => (
                            <Card
                              key={pos.posicao}
                              size="small"
                              style={{
                                background: pos.status === 'TRABALHO' ? '#f6ffed' : '#fff1f0',
                                borderColor: pos.status === 'TRABALHO' ? '#52c41a' : '#ff4d4f',
                              }}
                            >
                              <Row align="middle" justify="space-between">
                                <Col>
                                  <Space>
                                    <strong>Dia {pos.posicao + 1}</strong>
                                    <Tag color={pos.status === 'TRABALHO' ? 'green' : 'red'}>
                                      {pos.status}
                                    </Tag>
                                  </Space>
                                </Col>
                                <Col>
                                  <Switch
                                    checked={pos.status === 'TRABALHO'}
                                    checkedChildren="TRABALHO"
                                    unCheckedChildren="FOLGA"
                                    onChange={() => handleTogglePosicao(pos.posicao)}
                                  />
                                </Col>
                              </Row>
                            </Card>
                          ))}
                        </Space>

                        <div style={{ marginTop: 24 }}>
                          <strong>Preview do Ciclo:</strong>
                          <div style={{ marginTop: 8 }}>
                            {cicloPosicoes.map((pos) => (
                              <Tag
                                key={pos.posicao}
                                color={pos.status === 'TRABALHO' ? 'green' : 'red'}
                                style={{ marginBottom: 8 }}
                              >
                                D{pos.posicao + 1}: {pos.status === 'TRABALHO' ? 'T' : 'F'}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      </div>
                    ),
                  },
                ]
              : []),
            ...(tipoEscala.modoRepeticao === 'SEMANA_DEPENDENTE'
              ? [
                  {
                    key: 'semanas',
                    label: `Configurar Semanas (${tipoEscala.periodicidadeSemanas} semanas)`,
                    children: (
                      <div>
                        <p style={{ marginBottom: 16 }}>
                          Configure o padrão de cada semana. Para Espanhola (2 semanas):
                          <br />
                          - Semana A: Todos os dias trabalho
                          <br />
                          - Semana B: Trabalho Seg-Sex, Folga Sáb-Dom
                        </p>

                        {Array.from({ length: tipoEscala.periodicidadeSemanas || 0 }, (_, i) => i).map((semanaIndex: number) => (
                          <Card
                            key={`semana-${tipoEscala.id}-${semanaIndex}`}
                            title={`Semana ${String.fromCharCode(65 + semanaIndex)}`}
                            style={{ marginBottom: 16 }}
                          >
                            <Space wrap>
                              {Object.entries(DiaSemanaLabels).map(([dia, label]) => {
                                const mascara = semanaMascaras.find(
                                  (m: any) => m.semanaIndex === semanaIndex && m.dia === dia
                                );
                                const isTrabalho = mascara?.status === 'TRABALHO';

                                return (
                                  <Tag
                                    key={dia}
                                    color={isTrabalho ? 'green' : 'red'}
                                    style={{ cursor: 'pointer', fontSize: 14, padding: '4px 12px' }}
                                    onClick={() => {
                                      message.info('Edição de máscaras será implementada em breve');
                                      // TODO: Implementar toggle de máscara
                                    }}
                                  >
                                    {label}: {isTrabalho ? 'T' : 'F'}
                                  </Tag>
                                );
                              })}
                            </Space>
                          </Card>
                        ))}

                        <p style={{ marginTop: 16, color: '#999' }}>
                          🔧 Clique nos dias para alternar entre TRABALHO e FOLGA (em breve)
                        </p>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Card>
    </div>
  );
}

