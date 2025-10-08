/**
 * Componente de Visualização de Escala
 *
 * Mostra a escala em formato de grade:
 * - Linhas: Eletricistas
 * - Colunas: Dias do mês
 * - Células: T (trabalho - verde) ou F (folga - vermelho)
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Table, Spin, Tag, Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface VisualizarEscalaProps {
  escalaId: number;
  open: boolean;
  onClose: () => void;
}

interface SlotComAtribuicoes {
  id: number;
  data: Date;
  estado: string;
  Atribuicoes: Array<{
    id: number;
    eletricistaId: number;
    eletricista: {
      id: number;
      nome: string;
    };
  }>;
}

interface DadosEscala {
  id: number;
  equipe: { nome: string };
  tipoEscala: { nome: string };
  periodoInicio: Date;
  periodoFim: Date;
  Slots: SlotComAtribuicoes[];
}

export default function VisualizarEscala({ escalaId, open, onClose }: VisualizarEscalaProps) {
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<DadosEscala | null>(null);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar dados da escala com slots e atribuições
      const response = await fetch(`/api/escalas/${escalaId}/visualizar`);
      const result = await response.json();

      if (result.success) {
        console.log('Dados carregados:', {
          slots: result.data.Slots.length,
          totalAtribuicoes: result.data.Slots.reduce((sum: number, s: any) => sum + s.Atribuicoes.length, 0),
          primeiroSlot: result.data.Slots[0]
        });
        setDados(result.data);
      } else {
        console.error('Erro na resposta:', result);
      }
    } catch (error) {
      console.error('Erro ao carregar escala:', error);
    } finally {
      setLoading(false);
    }
  }, [escalaId]);

  useEffect(() => {
    if (open && escalaId) {
      carregarDados();
    }
  }, [open, escalaId, carregarDados]);

  if (loading) {
    return (
      <Modal
        title="Visualizar Escala"
        open={open}
        onCancel={onClose}
        footer={null}
        width={1200}
      >
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      </Modal>
    );
  }

  if (!dados) {
    return null;
  }

  // Extrair eletricistas únicos
  const eletricistasMap = new Map<number, string>();
  dados.Slots.forEach(slot => {
    slot.Atribuicoes.forEach(atr => {
      eletricistasMap.set(atr.eletricistaId, atr.eletricista.nome);
    });
  });
  const eletricistas = Array.from(eletricistasMap.entries()).map(([id, nome]) => ({ id, nome }));

  console.log('Eletricistas encontrados:', eletricistas);
  console.log('Total de slots:', dados.Slots.length);
  console.log('Slots com atribuições:', dados.Slots.filter(s => s.Atribuicoes.length > 0).length);

  // Gerar lista de dias
  const inicio = new Date(dados.periodoInicio);
  const fim = new Date(dados.periodoFim);
  const dias: Date[] = [];

  let currentDate = new Date(inicio);
  while (currentDate <= fim) {
    dias.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Criar estrutura de dados para a tabela
  const dataSource = eletricistas.map(elet => {
    const row: any = {
      key: elet.id,
      eletricista: elet.nome,
    };

    // Para cada dia, verificar se o eletricista trabalha
    dias.forEach(dia => {
      const diaKey = dia.toISOString().split('T')[0];
      const slot = dados.Slots.find(s => {
        const slotDate = new Date(s.data);
        return slotDate.toISOString().split('T')[0] === diaKey;
      });

      const trabalha = slot?.Atribuicoes.some(a => a.eletricistaId === elet.id);
      row[diaKey] = trabalha ? 'T' : 'F';
    });

    return row;
  });

  // Criar colunas dinamicamente
  const columns: ColumnsType<any> = [
    {
      title: 'Eletricista',
      dataIndex: 'eletricista',
      key: 'eletricista',
      fixed: 'left',
      width: 200,
      render: (nome: string) => <strong>{nome}</strong>,
    },
    ...dias.map(dia => {
      const diaKey = dia.toISOString().split('T')[0];
      const diaMes = dia.getDate();
      const diaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dia.getDay()];

      return {
        title: (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{diaMes}</div>
            <div style={{ fontSize: '10px', color: '#666' }}>{diaSemana}</div>
          </div>
        ),
        dataIndex: diaKey,
        key: diaKey,
        width: 50,
        align: 'center' as const,
        render: (status: string) => {
          if (status === 'T') {
            return (
              <Tag color="green" style={{ margin: 0, width: '100%' }}>
                T
              </Tag>
            );
          } else {
            return (
              <Tag color="red" style={{ margin: 0, width: '100%' }}>
                F
              </Tag>
            );
          }
        },
      };
    }),
  ];

  return (
    <Modal
      title={`Visualizar Escala - ${dados.equipe.nome}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width="95%"
      style={{ top: 20 }}
    >
      <Card size="small" style={{ marginBottom: 16 }}>
        <p><strong>Equipe:</strong> {dados.equipe.nome}</p>
        <p><strong>Tipo de Escala:</strong> {dados.tipoEscala.nome}</p>
        <p><strong>Período:</strong> {new Date(dados.periodoInicio).toLocaleDateString()} até {new Date(dados.periodoFim).toLocaleDateString()}</p>
        <p><strong>Total de Dias:</strong> {dias.length}</p>
        <p>
          <Tag color="green">T = Trabalho</Tag>
          <Tag color="red">F = Folga</Tag>
        </p>
      </Card>

      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        scroll={{ x: 'max-content' }}
        size="small"
        bordered
      />
    </Modal>
  );
}

