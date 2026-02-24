import React from 'react';
import {
  BarChartOutlined,
  CalendarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  FormOutlined,
  LogoutOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import type { MenuProps } from 'antd';

/**
 * Interface para definição dos itens de menu na configuração
 */
export interface MenuItemConfig {
  key: string;
  label: React.ReactNode | string;
  icon?: React.ReactNode;
  path?: string; // Se definido, envolve o label em um Link
  children?: MenuItemConfig[];
  onClick?: () => void;
}

/**
 * Estrutura de dados do Menu Lateral
 * Centraliza toda a configuração de navegação da aplicação.
 */
export const MENU_STRUCTURE: MenuItemConfig[] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    path: '/dashboard',
  },
  {
    key: 'cadastro',
    icon: <FormOutlined />,
    label: 'Cadastro',
    children: [
      {
        icon: <FileProtectOutlined />,
        key: '/dashboard/cadastro/contrato',
        label: 'Contratos',
        path: '/dashboard/cadastro/contrato',
      },
      {
        key: 'escalas-cadastro-menu',
        label: 'Escalas',
        icon: <CalendarOutlined />,
        children: [
          {
            key: '/dashboard/cadastro/tipo-escala',
            label: 'Tipos de Escala',
            path: '/dashboard/cadastro/tipo-escala',
          },
          {
            key: '/dashboard/cadastro/horario-equipe',
            label: 'Catálogo de Horários',
            path: '/dashboard/cadastro/horario-equipe',
          },
        ],
      },
      {
        key: 'equipe-menu',
        label: 'Equipe',
        icon: <TeamOutlined />,
        children: [
          {
            key: '/dashboard/cadastro/tipo-equipe',
            label: 'Tipos de Equipe',
            path: '/dashboard/cadastro/tipo-equipe',
          },
          {
            key: '/dashboard/cadastro/equipe',
            label: 'Equipes',
            path: '/dashboard/cadastro/equipe',
          },
        ],
      },
      {
        key: 'veiculos-menu',
        label: 'Veículos',
        icon: <CarOutlined />,
        children: [
          {
            key: '/dashboard/cadastro/tipo-veiculo',
            label: 'Tipos de Veículo',
            path: '/dashboard/cadastro/tipo-veiculo',
          },
          {
            key: '/dashboard/cadastro/veiculo',
            label: 'Veículos',
            path: '/dashboard/cadastro/veiculo',
          },
        ],
      },
      {
        key: '/dashboard/cadastro/cargo',
        label: 'Cargos',
        path: '/dashboard/cadastro/cargo',
      },
      {
        key: '/dashboard/cadastro/eletricista',
        label: 'Eletricista',
        path: '/dashboard/cadastro/eletricista',
      },
      {
        key: '/dashboard/cadastro/supervisor',
        label: 'Supervisor',
        path: '/dashboard/cadastro/supervisor',
      },
      {
        key: 'atividades-menu',
        label: 'Atividades',
        icon: <FileTextOutlined />,
        children: [
          {
            key: '/dashboard/cadastro/tipo-atividade',
            label: 'Tipos de Atividade',
            path: '/dashboard/cadastro/tipo-atividade',
          },
          {
            key: '/dashboard/cadastro/subtipo-atividade',
            label: 'Subtipos de Atividade',
            path: '/dashboard/cadastro/subtipo-atividade',
          },
          {
            key: '/dashboard/cadastro/material-catalogo',
            label: 'Materiais',
            path: '/dashboard/cadastro/material-catalogo',
          },
        ],
      },
      {
        key: '/dashboard/cadastro/base',
        label: 'Base',
        path: '/dashboard/cadastro/base',
      },
      {
        key: '/dashboard/cadastro/tipo-justificativa',
        label: 'Tipos de Justificativa',
        path: '/dashboard/cadastro/tipo-justificativa',
      },
      {
        key: 'apr',
        icon: <FileProtectOutlined />,
        label: 'APR',
        children: [
          {
            key: '/dashboard/cadastro/apr-pergunta',
            label: 'Perguntas',
            path: '/dashboard/cadastro/apr-pergunta',
          },
          {
            key: '/dashboard/cadastro/apr-opcao-resposta',
            label: 'Opções de Resposta',
            path: '/dashboard/cadastro/apr-opcao-resposta',
          },
          {
            key: '/dashboard/cadastro/apr-modelo',
            label: 'Modelo',
            path: '/dashboard/cadastro/apr-modelo',
          },
        ],
      },
      {
        key: 'checklist',
        icon: <CheckCircleOutlined />,
        label: 'Checklist',
        children: [
          {
            key: '/dashboard/cadastro/tipo-checklist',
            label: 'Tipo de Checklist',
            path: '/dashboard/cadastro/tipo-checklist',
          },
          {
            key: '/dashboard/cadastro/checklist-pergunta',
            label: 'Perguntas',
            path: '/dashboard/cadastro/checklist-pergunta',
          },
          {
            key: '/dashboard/cadastro/checklist-opcao-resposta',
            label: 'Opções de Resposta',
            path: '/dashboard/cadastro/checklist-opcao-resposta',
          },
          {
            key: '/dashboard/cadastro/checklist-modelo',
            label: 'Checklist',
            path: '/dashboard/cadastro/checklist-modelo',
          },
        ],
      },
      {
        key: 'usuarios',
        label: 'Usuários',
        icon: <UserOutlined />,
        children: [
          {
            key: '/dashboard/cadastro/usuario',
            label: 'Usuários Web',
            path: '/dashboard/cadastro/usuario',
          },
          {
            key: '/dashboard/cadastro/usuario-mobile',
            label: 'Usuários Móveis',
            path: '/dashboard/cadastro/usuario-mobile',
          },
        ],
      },
    ],
  },
  {
    key: 'turnos-menu',
    icon: <ClockCircleOutlined />,
    label: 'Turnos',
    children: [
      {
        key: '/dashboard/turnos',
        label: 'Visão Geral',
        path: '/dashboard/turnos',
      },
      {
        key: '/dashboard/turnos/historico',
        label: 'Histórico',
        path: '/dashboard/turnos/historico',
      },
    ],
  },
  {
    key: 'frequencia-menu',
    icon: <FileTextOutlined />,
    label: 'Frequência',
    children: [
      {
        key: '/dashboard/frequencia/visao-geral',
        label: 'Visão Geral',
        path: '/dashboard/frequencia/visao-geral',
      },
      {
        key: '/dashboard/frequencia/faltas',
        label: 'Faltas',
        path: '/dashboard/frequencia/faltas',
      },
      {
        key: '/dashboard/frequencia/justificativas-equipe',
        label: 'Justificativas de Equipe',
        path: '/dashboard/frequencia/justificativas-equipe',
      },

      {
        key: '/dashboard/frequencia/aderencia-escala',
        label: 'Aderência de Escala',
        path: '/dashboard/frequencia/aderencia-escala',
      },
    ],
  },
  {
    key: 'escalas-menu',
    icon: <CalendarOutlined />,
    label: 'Escalas',
    children: [
      {
        key: '/dashboard/escalas/escala-equipe-periodo',
        label: 'Gestão de Escala',
        path: '/dashboard/escalas/escala-equipe-periodo',
      },
      {
        key: '/dashboard/escalas/equipe-horario',
        label: 'Associar Horário',
        path: '/dashboard/escalas/equipe-horario',
      },
      {
        key: '/dashboard/escalas/edicao-em-curso',
        label: 'Edição em Curso',
        path: '/dashboard/escalas/edicao-em-curso',
      },
    ],
  },
  {
    key: 'seguranca-menu',
    icon: <SafetyOutlined />,
    label: 'Segurança',
    children: [
      {
        key: '/dashboard/seguranca/consulta-checklists',
        label: 'Consulta Checklists',
        path: '/dashboard/seguranca/consulta-checklists',
      },
      {
        key: '/dashboard/seguranca/checklists-pendentes',
        label: 'Tratamento de Pendências',
        path: '/dashboard/seguranca/checklists-pendentes',
      },
      {
        key: '/dashboard/seguranca/relatorio',
        label: 'Relatório',
        path: '/dashboard/seguranca/relatorio',
      },
    ],
  },
  {
    key: 'relatorios',
    icon: <BarChartOutlined />,
    label: 'Relatórios',
    children: [
      {
        key: '/dashboard/relatorios/bases',
        label: 'Bases',
        path: '/dashboard/relatorios/bases',
      },
      {
        key: '/dashboard/relatorios/veiculos',
        label: 'Veículos',
        path: '/dashboard/relatorios/veiculos',
      },
      {
        key: '/dashboard/relatorios/equipes',
        label: 'Equipes',
        path: '/dashboard/relatorios/equipes',
      },
      {
        key: '/dashboard/relatorios/eletricistas',
        label: 'Eletricistas',
        path: '/dashboard/relatorios/eletricistas',
      },
      {
        key: '/dashboard/relatorios/escalas',
        label: 'Escalas',
        path: '/dashboard/relatorios/escalas',
      },
      {
        key: '/dashboard/relatorios/turnos-por-periodo',
        label: 'Turnos por Período',
        path: '/dashboard/relatorios/turnos-por-periodo',
      },
      {
        key: '/dashboard/relatorios/aderencia-equipe',
        label: 'Aderência de Equipes',
        path: '/dashboard/relatorios/aderencia-equipe',
      },
      {
        key: '/dashboard/relatorios/localizacao',
        label: 'Localização',
        path: '/dashboard/relatorios/localizacao',
      },
    ],
  },
  {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: 'Sair',
    onClick: async () => {
      await signOut({
        callbackUrl: '/login',
        redirect: true,
      });
    },
  },
];

/**
 * Transforma a configuração estruturada em itens compatíveis com Ant Design Menu
 */
export const getAntdMenuItems = (
  config: MenuItemConfig[]
): MenuProps['items'] => {
  return config.map(item => {
    // Processa o label (adiciona Link se tiver path e não for submenu)
    let label = item.label;
    if (item.path && !item.children) {
      label = <Link href={item.path}>{item.label}</Link>;
    } else if (item.onClick) {
      label = <span onClick={item.onClick}>{item.label}</span>;
    }

    // Processa children recursivamente
    const children = item.children
      ? getAntdMenuItems(item.children)
      : undefined;

    return {
      key: item.key,
      icon: item.icon,
      label,
      children,
    } as any;
  });
};

/**
 * Encontra recursivamente as chaves dos menus pais que devem estar abertos
 * para uma determinada rota atual.
 *
 * Substitui o antigo sistema de 'routeToMenuKey' manual.
 */
export const findOpenKeys = (
  pathname: string,
  items: MenuItemConfig[] = MENU_STRUCTURE
): string[] => {
  for (const item of items) {
    // Se o item tem filhos, verifica se algum deles corresponde à rota
    if (item.children) {
      // Verifica recursivamente nos filhos
      const childKeys = findOpenKeys(pathname, item.children);

      // Se encontrou nos filhos (childKeys não vazio) OU se a própria rota começa com a key deste item (ex: /dashboard/cadastro/...)
      // Nota: A key pode não ser uma rota válida (ex: 'cadastro'), então verificamos se a rota atual
      // começa com o path (se existir) ou se algum filho deu match
      if (childKeys.length > 0) {
        return [item.key, ...childKeys];
      }

      // Fallback para submenus que não têm path direto mas a rota começa com o que seria esperado?
      // Neste caso, a recursão acima já deve ter resolvido se as chaves dos filhos baterem.
      // O antigo sistema tinha 'routeToMenuKey'.

      // Verifica se algum filho tem key igual ao pathname
      const hasDirectChild = item.children.some(
        child => child.key === pathname
      );
      if (hasDirectChild) {
        return [item.key];
      }
    } else {
      // Item folha
      if (item.key === pathname) {
        // Retorna array vazio pois este é o item selecionado, não um que precisa ser aberto
        // (Quem precisa ser aberto é o pai, que vai receber esse retorno na recursão)
        return [item.key];
      }
    }
  }
  return [];
};
