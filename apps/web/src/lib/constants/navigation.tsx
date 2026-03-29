import React from 'react';
import {
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  FormOutlined,
  KeyOutlined,
  LogoutOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PERMISSIONS } from '@/lib/types/permissions';
import type { Permission } from '@/lib/types/permissions';
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
  pathPrefix?: string;
  requiredPermission?: Permission;
  requiredPermissionsAny?: Permission[];
  children?: MenuItemConfig[];
  onClick?: () => void;
}

interface RoutePermissionRule {
  permissions?: Permission[];
  specificity: number;
  type: 'exact' | 'prefix';
}

const resolveRequiredPermissions = (
  item: MenuItemConfig,
  inheritedPermissions?: Permission[]
): Permission[] | undefined =>
  item.requiredPermissionsAny ??
  (item.requiredPermission ? [item.requiredPermission] : inheritedPermissions);

const isPrefixMatch = (pathname: string, prefix: string): boolean =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

const getRoutePermissionRule = (
  pathname: string,
  items: MenuItemConfig[],
  inheritedPermissions?: Permission[]
): RoutePermissionRule | undefined => {
  let bestMatch: RoutePermissionRule | undefined;

  for (const item of items) {
    const permissions = resolveRequiredPermissions(item, inheritedPermissions);

    if (item.path === pathname) {
      const match: RoutePermissionRule = {
        permissions,
        specificity: item.path.length,
        type: 'exact',
      };

      if (
        !bestMatch ||
        bestMatch.type !== 'exact' ||
        match.specificity >= bestMatch.specificity
      ) {
        bestMatch = match;
      }
    }

    if (item.pathPrefix && isPrefixMatch(pathname, item.pathPrefix)) {
      const match: RoutePermissionRule = {
        permissions,
        specificity: item.pathPrefix.length,
        type: 'prefix',
      };

      if (
        !bestMatch ||
        (bestMatch.type === 'prefix' &&
          match.specificity >= bestMatch.specificity)
      ) {
        bestMatch = match;
      }
    }

    if (item.children) {
      const childMatch = getRoutePermissionRule(
        pathname,
        item.children,
        permissions
      );

      if (
        childMatch &&
        (!bestMatch ||
          childMatch.type === 'exact' ||
          (bestMatch.type === 'prefix' &&
            childMatch.specificity >= bestMatch.specificity))
      ) {
        bestMatch = childMatch;
      }
    }
  }

  return bestMatch;
};

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
    requiredPermission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    key: 'cadastro',
    icon: <FormOutlined />,
    label: 'Cadastro',
    pathPrefix: '/dashboard/cadastro',
    children: [
      {
        icon: <FileProtectOutlined />,
        key: '/dashboard/cadastro/contrato',
        label: 'Contratos',
        path: '/dashboard/cadastro/contrato',
        requiredPermission: PERMISSIONS.CONTRATOS_VIEW,
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
            pathPrefix: '/dashboard/cadastro/tipo-escala',
            requiredPermission: PERMISSIONS.TIPOS_ESCALA_VIEW,
          },
          {
            key: '/dashboard/cadastro/horario-equipe',
            label: 'Catálogo de Horários',
            path: '/dashboard/cadastro/horario-equipe',
            requiredPermission: PERMISSIONS.HORARIOS_EQUIPE_VIEW,
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
            requiredPermission: PERMISSIONS.TIPOS_EQUIPE_VIEW,
          },
          {
            key: '/dashboard/cadastro/equipe',
            label: 'Equipes',
            path: '/dashboard/cadastro/equipe',
            requiredPermission: PERMISSIONS.EQUIPES_VIEW,
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
            requiredPermission: PERMISSIONS.TIPOS_VEICULO_VIEW,
          },
          {
            key: '/dashboard/cadastro/veiculo',
            label: 'Veículos',
            path: '/dashboard/cadastro/veiculo',
            requiredPermission: PERMISSIONS.VEICULOS_VIEW,
          },
        ],
      },
      {
        key: 'projetos-cadastro-menu',
        label: 'Projetos',
        icon: <AppstoreOutlined />,
        children: [
          {
            key: '/dashboard/cadastro/projetos/programas',
            label: 'Programas',
            path: '/dashboard/cadastro/projetos/programas',
            requiredPermission: PERMISSIONS.PROJETOS_PROGRAMAS_VIEW,
          },
          {
            key: '/dashboard/cadastro/projetos/tipo-poste',
            label: 'Tipos de Poste',
            path: '/dashboard/cadastro/projetos/tipo-poste',
            requiredPermission: PERMISSIONS.PROJETOS_TIPOS_POSTE_VIEW,
          },
          {
            key: '/dashboard/cadastro/projetos/tipo-estrutura',
            label: 'Tipos de Estrutura',
            path: '/dashboard/cadastro/projetos/tipo-estrutura',
            requiredPermission: PERMISSIONS.PROJETOS_TIPOS_ESTRUTURA_VIEW,
          },
          {
            key: '/dashboard/cadastro/projetos/tipo-ramal',
            label: 'Tipos de Ramal',
            path: '/dashboard/cadastro/projetos/tipo-ramal',
            requiredPermission: PERMISSIONS.PROJETOS_TIPOS_RAMAL_VIEW,
          },
        ],
      },
      {
        key: '/dashboard/cadastro/cargo',
        label: 'Cargos',
        path: '/dashboard/cadastro/cargo',
        requiredPermission: PERMISSIONS.CARGOS_VIEW,
      },
      {
        key: '/dashboard/cadastro/eletricista',
        label: 'Eletricista',
        path: '/dashboard/cadastro/eletricista',
        requiredPermission: PERMISSIONS.ELETRICISTAS_VIEW,
      },
      {
        key: '/dashboard/cadastro/supervisor',
        label: 'Supervisor',
        path: '/dashboard/cadastro/supervisor',
        requiredPermission: PERMISSIONS.SUPERVISORES_VIEW,
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
            requiredPermission: PERMISSIONS.TIPOS_ATIVIDADE_VIEW,
          },
          {
            key: '/dashboard/cadastro/subtipo-atividade',
            label: 'Subtipos de Atividade',
            path: '/dashboard/cadastro/subtipo-atividade',
            requiredPermission: PERMISSIONS.SUBTIPOS_ATIVIDADE_VIEW,
          },
          {
            key: '/dashboard/cadastro/material-catalogo',
            label: 'Materiais',
            path: '/dashboard/cadastro/material-catalogo',
            requiredPermission: PERMISSIONS.MATERIAIS_CATALOGO_VIEW,
          },
          {
            key: '/dashboard/cadastro/motivos-improdutivos',
            label: 'Motivos Improdutivos',
            path: '/dashboard/cadastro/motivos-improdutivos',
            requiredPermission: PERMISSIONS.CAUSAS_IMPRODUTIVAS_VIEW,
          },
          {
            key: '/dashboard/cadastro/formulario-atividade',
            label: 'Formulários',
            path: '/dashboard/cadastro/formulario-atividade',
            requiredPermission: PERMISSIONS.FORMULARIOS_ATIVIDADE_VIEW,
          },
          {
            key: '/dashboard/cadastro/formulario-atividade-pergunta',
            label: 'Perguntas (Catálogo)',
            path: '/dashboard/cadastro/formulario-atividade-pergunta',
            requiredPermission: PERMISSIONS.FORMULARIOS_ATIVIDADE_PERGUNTA_VIEW,
          },
        ],
      },
      {
        key: '/dashboard/cadastro/base',
        label: 'Base',
        path: '/dashboard/cadastro/base',
        requiredPermission: PERMISSIONS.BASES_VIEW,
      },
      {
        key: '/dashboard/cadastro/tipo-justificativa',
        label: 'Tipos de Justificativa',
        path: '/dashboard/cadastro/tipo-justificativa',
        requiredPermission: PERMISSIONS.TIPOS_JUSTIFICATIVA_VIEW,
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
            requiredPermission: PERMISSIONS.APR_PERGUNTAS_VIEW,
          },
          {
            key: '/dashboard/cadastro/apr-opcao-resposta',
            label: 'Opções de Resposta',
            path: '/dashboard/cadastro/apr-opcao-resposta',
            requiredPermission: PERMISSIONS.APR_OPCOES_VIEW,
          },
          {
            key: '/dashboard/cadastro/apr-grupo-pergunta',
            label: 'Grupos de Perguntas',
            path: '/dashboard/cadastro/apr-grupo-pergunta',
            requiredPermission: PERMISSIONS.APR_GRUPOS_VIEW,
          },
          {
            key: '/dashboard/cadastro/apr-modelo',
            label: 'Modelo',
            path: '/dashboard/cadastro/apr-modelo',
            requiredPermission: PERMISSIONS.APR_MODELOS_VIEW,
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
            requiredPermission: PERMISSIONS.CHECKLIST_TIPOS_VIEW,
          },
          {
            key: '/dashboard/cadastro/checklist-pergunta',
            label: 'Perguntas',
            path: '/dashboard/cadastro/checklist-pergunta',
            requiredPermission: PERMISSIONS.CHECKLIST_PERGUNTAS_VIEW,
          },
          {
            key: '/dashboard/cadastro/checklist-opcao-resposta',
            label: 'Opções de Resposta',
            path: '/dashboard/cadastro/checklist-opcao-resposta',
            requiredPermission: PERMISSIONS.CHECKLIST_OPCOES_VIEW,
          },
          {
            key: '/dashboard/cadastro/checklist-modelo',
            label: 'Checklist',
            path: '/dashboard/cadastro/checklist-modelo',
            requiredPermission: PERMISSIONS.CHECKLIST_MODELOS_VIEW,
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
            requiredPermission: PERMISSIONS.USERS_VIEW,
          },
          {
            key: '/dashboard/cadastro/usuario-mobile',
            label: 'Usuários Móveis',
            path: '/dashboard/cadastro/usuario-mobile',
            requiredPermission: PERMISSIONS.MOBILE_USERS_VIEW,
          },
          {
            key: '/dashboard/cadastro/grupo-permissao',
            label: 'Grupos de Permissão',
            icon: <KeyOutlined />,
            path: '/dashboard/cadastro/grupo-permissao',
            requiredPermission: PERMISSIONS.USERS_UPDATE,
          },
        ],
      },
    ],
  },
  {
    key: 'turnos-menu',
    icon: <ClockCircleOutlined />,
    label: 'Turnos',
    pathPrefix: '/dashboard/turnos',
    requiredPermission: PERMISSIONS.SHIFTS_VIEW,
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
    key: 'atividades-dashboard-menu',
    icon: <AppstoreOutlined />,
    label: 'Atividades',
    pathPrefix: '/dashboard/atividades',
    requiredPermission: PERMISSIONS.ACTIVITIES_VIEW,
    children: [
      {
        key: '/dashboard/atividades/visao-geral',
        label: 'Visão Geral',
        path: '/dashboard/atividades/visao-geral',
      },
      {
        key: '/dashboard/atividades/medidores',
        label: 'Medidores',
        path: '/dashboard/atividades/medidores',
      },
      {
        key: '/dashboard/atividades/materiais',
        label: 'Materiais',
        path: '/dashboard/atividades/materiais',
      },
    ],
  },
  {
    key: 'frequencia-menu',
    icon: <FileTextOutlined />,
    label: 'Frequência',
    pathPrefix: '/dashboard/frequencia',
    requiredPermission: PERMISSIONS.ATTENDANCE_VIEW,
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
    key: 'projetos-menu',
    icon: <AppstoreOutlined />,
    label: 'Projetos',
    pathPrefix: '/dashboard/projetos',
    requiredPermissionsAny: [
      PERMISSIONS.PROJECTS_VIEW,
      PERMISSIONS.PROJETOS_TIPOS_POSTE_VIEW,
      PERMISSIONS.PROJETOS_TIPOS_ESTRUTURA_VIEW,
      PERMISSIONS.PROJETOS_TIPOS_RAMAL_VIEW,
    ],
    children: [
      {
        key: '/dashboard/projetos/cadastro',
        label: 'Cadastro de Projetos',
        path: '/dashboard/projetos/cadastro',
      },
    ],
  },
  {
    key: 'escalas-menu',
    icon: <CalendarOutlined />,
    label: 'Escalas',
    pathPrefix: '/dashboard/escalas',
    requiredPermission: PERMISSIONS.SCHEDULES_VIEW,
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
    pathPrefix: '/dashboard/seguranca',
    requiredPermission: PERMISSIONS.SAFETY_VIEW,
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
    pathPrefix: '/dashboard/relatorios',
    requiredPermission: PERMISSIONS.REPORTS_VIEW,
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

export const filterMenuByPermissions = (
  config: MenuItemConfig[],
  permissions: Permission[],
  inheritedPermissions?: Permission[]
): MenuItemConfig[] => {
  return config.flatMap(item => {
    const requiredPermissions = resolveRequiredPermissions(
      item,
      inheritedPermissions
    );
    if (
      requiredPermissions &&
      requiredPermissions.length > 0 &&
      !requiredPermissions.some((permission) => permissions.includes(permission))
    ) {
      return [];
    }

    const children = item.children
      ? filterMenuByPermissions(
          item.children,
          permissions,
          requiredPermissions
        )
      : undefined;

    if (item.children && (!children || children.length === 0)) {
      return [];
    }

    return [
      {
        ...item,
        children,
      },
    ];
  });
};

export const getRequiredPermissionsForPath = (
  pathname: string
): Permission[] | undefined => {
  return getRoutePermissionRule(pathname, MENU_STRUCTURE)?.permissions;
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
