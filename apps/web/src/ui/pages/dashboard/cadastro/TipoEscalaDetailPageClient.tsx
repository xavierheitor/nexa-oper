/**
 * Página de Edição Detalhada de Tipo de Escala
 *
 * Permite configurar as posições do ciclo ou máscaras de semana
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, Tabs, Button, Tag, Space, Row, Col, Switch, Spin, App } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { getTipoEscalaById, salvarPosicoesCiclo, salvarMascarasSemanas } from '@/lib/actions/escala/tipoEscala';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

interface TipoEscalaDetailPageClientProps {
  id: string;
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

export default function TipoEscalaDetailPageClient({
  id,
}: TipoEscalaDetailPageClientProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const [tipoEscala, setTipoEscala] = useState<TipoEscalaWithRelations | null>(null);
  const [cicloPosicoes, setCicloPosicoes] = useState<{ posicao: number; status: string }[]>([]);
  const [semanaMascaras, setSemanaMascaras] = useState<{ semanaIndex: number; dia: string; status: string }[]>([]);

  // Carregar dados do tipo de escala
  const { data: tipoEscalaData, loading, refetch } = useDataFetch<TipoEscalaWithRelations>(
    async () => {
      const result = await getTipoEscalaById(Number(id));
      if (result.success && result.data) {
        return result.data as TipoEscalaWithRelations;
      }
      throw new Error(result.error || 'Erro ao carregar tipo de escala');
    },
    [id],
    {
      onError: () => {
        message.error('Erro ao carregar tipo de escala');
      },
      onSuccess: (data) => {
        const tipoEscalaLoaded = data as TipoEscalaWithRelations;
        setTipoEscala(tipoEscalaLoaded);

        // Inicializar posições do ciclo
        if (tipoEscalaLoaded.modoRepeticao === 'CICLO_DIAS' && tipoEscalaLoaded.cicloDias) {
          const posicoes = tipoEscalaLoaded.CicloPosicoes || [];
          const posicoesCompletas = [];

          for (let i = 0; i < tipoEscalaLoaded.cicloDias; i++) {
            const existente = posicoes.find((p) => p.posicao === i);
            posicoesCompletas.push({
              posicao: i,
              status: existente?.status || 'TRABALHO',
              id: existente?.id,
            });
          }

          setCicloPosicoes(posicoesCompletas);
        }

        // Inicializar máscaras de semana
        if (tipoEscalaLoaded.modoRepeticao === 'SEMANA_DEPENDENTE' && tipoEscalaLoaded.periodicidadeSemanas) {
          const mascaras = tipoEscalaLoaded.SemanaMascaras || [];
          const mascarasCompletas = [];

          // Para cada semana e cada dia, criar uma máscara
          const diasSemana = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];
          for (let semanaIdx = 0; semanaIdx < tipoEscalaLoaded.periodicidadeSemanas; semanaIdx++) {
            for (const dia of diasSemana) {
              const existente = mascaras.find(
                (m) => m.semanaIndex === semanaIdx && m.dia === dia
              );
              mascarasCompletas.push({
                semanaIndex: semanaIdx,
                dia,
                status: existente?.status || 'TRABALHO',
              });
            }
          }

          setSemanaMascaras(mascarasCompletas);
        }
      }
    }
  );

  // Sincronizar tipoEscalaData com tipoEscala state quando os dados mudarem
  useEffect(() => {
    if (tipoEscalaData && !tipoEscala) {
      setTipoEscala(tipoEscalaData);
    }
  }, [tipoEscalaData, tipoEscala]);

  const handleTogglePosicao = (posicao: number) => {
    setCicloPosicoes(prev =>
      prev.map(p =>
        p.posicao === posicao
          ? { ...p, status: p.status === 'TRABALHO' ? 'FOLGA' : 'TRABALHO' }
          : p
      )
    );
  };

  const handleToggleMascara = (semanaIndex: number, dia: string) => {
    console.log('Toggle mascara:', { semanaIndex, dia, semanaMascaras });
    setSemanaMascaras(prev => {
      const updated = prev.map(m =>
        m.semanaIndex === semanaIndex && m.dia === dia
          ? { ...m, status: m.status === 'TRABALHO' ? 'FOLGA' : 'TRABALHO' }
          : m
      );
      console.log('Updated mascaras:', updated);
      return updated;
    });
  };

  const handleSavePosicoes = async () => {
    if (!tipoEscala) return;

    try {
      if (tipoEscala.modoRepeticao === 'CICLO_DIAS') {
        const result = await salvarPosicoesCiclo({
          tipoEscalaId: tipoEscala.id,
          posicoes: cicloPosicoes.map(p => ({
            posicao: p.posicao,
            status: p.status,
          })),
        });

        if (result.success) {
          message.success('Posições do ciclo salvas com sucesso!');
          await refetch();
        } else {
          message.error(result.error || 'Erro ao salvar posições');
        }
      } else if (tipoEscala.modoRepeticao === 'SEMANA_DEPENDENTE') {
        const result = await salvarMascarasSemanas({
          tipoEscalaId: tipoEscala.id,
          mascaras: semanaMascaras.map(m => ({
            semanaIndex: m.semanaIndex,
            dia: m.dia,
            status: m.status,
          })),
        });

        if (result.success) {
          message.success('Máscaras de semana salvas com sucesso!');
          await refetch();
        } else {
          message.error(result.error || 'Erro ao salvar máscaras');
        }
      }
    } catch (error) {
      message.error('Erro ao salvar configurações');
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
                          <div key={`semana-${tipoEscala.id}-${semanaIndex}`} style={{ marginBottom: 24 }}>
                            <h4 style={{ marginBottom: 12 }}>Semana {String.fromCharCode(65 + semanaIndex)}</h4>
                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                              {Object.entries(DiaSemanaLabels).map(([dia, label]) => {
                                const mascara = semanaMascaras.find(
                                  m => m.semanaIndex === semanaIndex && m.dia === dia
                                );
                                const isTrabalho = mascara?.status === 'TRABALHO';

                                return (
                                  <Card
                                    key={dia}
                                    size="small"
                                    style={{
                                      background: isTrabalho ? '#f6ffed' : '#fff1f0',
                                      borderColor: isTrabalho ? '#52c41a' : '#ff4d4f',
                                    }}
                                  >
                                    <Row align="middle" justify="space-between">
                                      <Col>
                                        <Space>
                                          <strong>{label}</strong>
                                          <Tag color={isTrabalho ? 'green' : 'red'}>
                                            {isTrabalho ? 'TRABALHO' : 'FOLGA'}
                                          </Tag>
                                        </Space>
                                      </Col>
                                      <Col>
                                        <Switch
                                          checked={isTrabalho}
                                          checkedChildren="TRABALHO"
                                          unCheckedChildren="FOLGA"
                                          onChange={() => handleToggleMascara(semanaIndex, dia)}
                                        />
                                      </Col>
                                    </Row>
                                  </Card>
                                );
                              })}
                            </Space>
                          </div>
                        ))}
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
