/**
 * Componente de Visualização de Escala
 *
 * Mostra a escala em formato de grade:
 * - Linhas: Eletricistas
 * - Colunas: Dias do mês
 * - Células: T (trabalho - verde) ou F (folga - vermelho)
 */

'use client';

import React, { useState } from 'react';
import { Modal, Table, Spin, Tag, Card, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { visualizarEscala } from '@/lib/actions/escala/escalaEquipePeriodo';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

interface VisualizarEscalaProps {
  escalaId: number;
  open: boolean;
  onClose: () => void;
}

interface Slot {
  id: number;
  data: Date;
  estado: 'TRABALHO' | 'FOLGA' | 'FALTA' | 'EXCECAO';
  eletricistaId: number;
  eletricista: {
    id: number;
    nome: string;
    matricula: string;
  };
  inicioPrevisto: string | null;
  fimPrevisto: string | null;
}

interface DadosEscala {
  id: number;
  equipe: { nome: string };
  tipoEscala: { nome: string };
  periodoInicio: Date;
  periodoFim: Date;
  status: string;
  Slots: Slot[];
  estatisticas?: {
    totalSlots: number;
    eletricistasUnicos: number;
    diasComTrabalho: number;
    diasComFolga: number;
  };
}

export default function VisualizarEscala({ escalaId, open, onClose }: VisualizarEscalaProps) {
  // Carregar dados da escala quando o modal abrir
  const { data: dados, loading } = useDataFetch<DadosEscala>(
    async () => {
      const result = await visualizarEscala(escalaId);
      if (result.success && result.data) {
        // Fazer cast explícito para o tipo esperado, já que o handleServerAction
        // não preserva completamente os tipos do Prisma
        const dadosCompleto = result.data as unknown as DadosEscala;
        return dadosCompleto;
      }
      throw new Error(result.error || 'Erro ao carregar escala');
    },
    [open, escalaId],
    {
      immediate: false, // Não carrega automaticamente
      onError: (error) => {
        message.error(typeof error === 'string' ? error : 'Erro ao carregar escala');
      },
      onSuccess: (data) => {
        const dadosCompleto = data as DadosEscala;
        console.log('Dados carregados:', {
          slots: dadosCompleto.Slots?.length || 0,
          eletricistas: dadosCompleto.estatisticas?.eletricistasUnicos || 0,
        });
      }
    }
  );


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

  // Extrair eletricistas únicos dos slots
  const eletricistasMap = new Map<number, { nome: string; matricula: string }>();
  dados.Slots.forEach(slot => {
    if (!eletricistasMap.has(slot.eletricistaId)) {
      eletricistasMap.set(slot.eletricistaId, {
        nome: slot.eletricista.nome,
        matricula: slot.eletricista.matricula,
      });
    }
  });
  const eletricistas = Array.from(eletricistasMap.entries()).map(([id, info]) => ({
    id,
    nome: info.nome,
    matricula: info.matricula,
  }));

  console.log('Eletricistas encontrados:', eletricistas.length);
  console.log('Total de slots:', dados.Slots.length);

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
      matricula: elet.matricula,
    };

    // Para cada dia, buscar o slot deste eletricista
    dias.forEach(dia => {
      const diaKey = dia.toISOString().split('T')[0];
      const slot = dados.Slots.find(s => {
        const slotDate = new Date(s.data);
        return slotDate.toISOString().split('T')[0] === diaKey && s.eletricistaId === elet.id;
      });

      // Usar o estado do slot
      row[diaKey] = slot ? slot.estado : null;
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
      width: 180,
      render: (nome: string, record: any) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{nome}</div>
          <div style={{ fontSize: '11px', color: '#666' }}>{record.matricula}</div>
        </div>
      ),
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
        render: (estado: string | null) => {
          if (!estado) {
            return <span style={{ color: '#ccc' }}>-</span>;
          }

          const config = {
            TRABALHO: { color: 'green', label: 'T', title: 'Trabalho' },
            FOLGA: { color: 'red', label: 'F', title: 'Folga' },
            FALTA: { color: 'orange', label: 'X', title: 'Falta' },
            EXCECAO: { color: 'blue', label: 'E', title: 'Exceção' },
          }[estado] || { color: 'default', label: '?', title: estado };

          return (
            <Tag
              color={config.color}
              style={{ margin: 0, width: '100%', cursor: 'help' }}
              title={config.title}
            >
              {config.label}
            </Tag>
          );
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
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p><strong>Equipe:</strong> {dados.equipe.nome}</p>
            <p><strong>Tipo de Escala:</strong> {dados.tipoEscala.nome}</p>
            <p><strong>Período:</strong> {new Date(dados.periodoInicio).toLocaleDateString()} até {new Date(dados.periodoFim).toLocaleDateString()}</p>
            <p><strong>Total de Dias:</strong> {dias.length} | <strong>Eletricistas:</strong> {eletricistas.length}</p>
          </div>
          <div>
            <p><strong>Legenda:</strong></p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Tag color="green">T = Trabalho</Tag>
              <Tag color="red">F = Folga</Tag>
              <Tag color="orange">X = Falta</Tag>
              <Tag color="blue">E = Exceção</Tag>
            </div>
          </div>
        </div>
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

