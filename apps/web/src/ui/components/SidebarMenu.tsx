/**
 * Componente de Menu Lateral (Sidebar)
 *
 * Este componente implementa o menu de navegação lateral da aplicação,
 * com suporte a colapso, expansão automática e destacamento da página atual.
 *
 * FUNCIONALIDADES:
 * - Menu hierárquico com múltiplos níveis
 * - Colapso/expansão do sidebar
 * - Destacamento automático da página atual
 * - Expansão automática da cadeia de menus até a página atual
 * - Navegação via Next.js Link
 * - Tema escuro consistente
 * - Logout integrado
 *
 * ESTRUTURA DO MENU:
 * - Dashboard (página principal)
 * - Cadastro (submenu com várias seções)
 *   - Contratos
 *   - Escalas (submenu: Tipos de Escala, Catálogo de Horários, Horários das Equipes)
 *   - Equipe (submenu: Tipos, Equipes)
 *   - Veículos (submenu: Tipos, Veículos)
 *   - Eletricista, Supervisor, Tipo de Atividade, Base
 *   - APR (submenu: Perguntas, Opções, Modelo)
 *   - Checklist (submenu: Tipo, Perguntas, Opções, Modelo)
 *   - Usuários (submenu: Web, Móveis)
 * - Relatórios (submenu com vários relatórios)
 * - Turnos (submenu: Visão Geral, Histórico)
 * - Frequência (submenu: Visão Geral, Faltas, Horas Extras, Justificativas de Equipe)
 * - Escalas (submenu: Gestão de Escala, Associar Horário)
 * - Logout
 *
 * COMPORTAMENTO DE EXPANSÃO:
 * - Detecta automaticamente a página atual via usePathname()
 * - Expande todos os menus pais necessários para mostrar a página atual
 * - Mantém estado de expansão durante navegação
 * - Preserva funcionalidades de colapso manual
 *
 * EXEMPLO DE USO:
 * ```typescript
 * <SidebarMenu
 *   collapsed={sidebarCollapsed}
 *   onCollapseChange={setSidebarCollapsed}
 * />
 * ```
 */

'use client';

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
  UserOutlined
} from '@ant-design/icons';
import { Layout, Menu, Typography } from 'antd';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import React from 'react';

const { Sider } = Layout;
const { Title } = Typography;

/**
 * Interface das propriedades do componente SidebarMenu
 *
 * Define as props aceitas pelo componente de menu lateral.
 */
interface SidebarMenuProps {
  /** Estado de colapso do sidebar (true = colapsado, false = expandido) */
  collapsed: boolean;

  /** Callback chamado quando o estado de colapso muda */
  onCollapseChange: (collapsed: boolean) => void;
}

/**
 * Componente principal do Menu Lateral
 *
 * Renderiza o menu de navegação lateral com expansão automática
 * baseada na rota atual do usuário.
 *
 * @param props - Propriedades do componente
 * @returns JSX.Element - Menu lateral renderizado
 */
const SidebarMenu: React.FC<SidebarMenuProps> = ({ collapsed, onCollapseChange }) => {
  // Hook do Next.js para obter a rota atual
  const pathname = usePathname();

  /**
   * Função para calcular as chaves de menus que devem estar abertos
   *
   * Analisa a rota atual e determina quais menus pais devem estar
   * expandidos para mostrar a página atual.
   *
   * LÓGICA DE EXPANSÃO:
   * - Identifica todos os menus pais na hierarquia
   * - Retorna array com chaves de todos os níveis necessários
   * - Garante que a página atual seja visível
   *
   * @returns string[] - Array de chaves de menus a serem expandidos
   *
   * @example
   * // Para rota '/dashboard/cadastro/apr-modelo'
   * // Retorna: ['cadastro', 'apr']
   *
   * // Para rota '/dashboard/cadastro/equipe'
   * // Retorna: ['cadastro', 'equipe-menu']
   */
  const getDefaultOpenKeys = (): string[] => {
    const openKeys: string[] = [];

    // Sempre abre 'cadastro' se a rota começar com /dashboard/cadastro/
    if (pathname.startsWith('/dashboard/cadastro/')) {
      openKeys.push('cadastro');
    }

    // Sempre abre 'escalas-menu' se a rota for de escalas principal
    if (pathname === '/dashboard/cadastro/escala-equipe-periodo' ||
        pathname === '/dashboard/cadastro/equipe-horario' ||
        pathname === '/dashboard/escalas/edicao-em-curso') {
      openKeys.push('escalas-menu');
    }

    // Mapeamento de rotas para suas chaves de menu pai
    const routeToMenuKey: Record<string, string> = {
      // Submenus de Equipe
      '/dashboard/cadastro/tipo-equipe': 'equipe-menu',
      '/dashboard/cadastro/equipe': 'equipe-menu',

      // Submenus de Veículos
      '/dashboard/cadastro/tipo-veiculo': 'veiculos-menu',
      '/dashboard/cadastro/veiculo': 'veiculos-menu',

      // Submenus de Escalas (no menu principal Escalas)
      '/dashboard/cadastro/escala-equipe-periodo': 'escalas-menu',
      '/dashboard/cadastro/equipe-horario': 'escalas-menu',

      // Submenus de Escalas (dentro de Cadastro)
      '/dashboard/cadastro/tipo-escala': 'escalas-cadastro-menu',
      '/dashboard/cadastro/horario-equipe': 'escalas-cadastro-menu',

      // Submenus de Escalas (menu principal)
      '/dashboard/escalas/edicao-em-curso': 'escalas-menu',

      // Submenus de APR
      '/dashboard/cadastro/apr-pergunta': 'apr',
      '/dashboard/cadastro/apr-opcao-resposta': 'apr',
      '/dashboard/cadastro/apr-modelo': 'apr',

      // Submenus de Checklist
      '/dashboard/cadastro/tipo-checklist': 'checklist',
      '/dashboard/cadastro/checklist-pergunta': 'checklist',
      '/dashboard/cadastro/checklist-opcao-resposta': 'checklist',
      '/dashboard/cadastro/checklist-modelo': 'checklist',

      // Submenus de Usuários
      '/dashboard/cadastro/usuario': 'usuarios',
      '/dashboard/cadastro/usuario-mobile': 'usuarios',

      // Submenus de Turnos
      '/dashboard/turnos': 'turnos-menu',
      '/dashboard/historico': 'turnos-menu',

      // Submenus de Frequência
      '/dashboard/frequencia/eletricista': 'frequencia-menu',
      '/dashboard/frequencia/equipe': 'frequencia-menu',
      '/dashboard/frequencia/faltas': 'frequencia-menu',
      '/dashboard/frequencia/horas-extras': 'frequencia-menu',
      '/dashboard/frequencia/justificativas-equipe': 'frequencia-menu',
      '/dashboard/frequencia/reconciliacao-manual': 'frequencia-menu',

      // Submenus de Relatórios
      '/dashboard/relatorios/bases': 'relatorios',
      '/dashboard/relatorios/veiculos': 'relatorios',
      '/dashboard/relatorios/equipes': 'relatorios',
      '/dashboard/relatorios/eletricistas': 'relatorios',
      '/dashboard/relatorios/escalas': 'relatorios',
      '/dashboard/relatorios/aderencia-equipe': 'relatorios',
      '/dashboard/relatorios/turnos-por-periodo': 'relatorios',

      // Submenus de Segurança
      '/dashboard/seguranca/checklists-pendentes': 'seguranca-menu',
      '/dashboard/seguranca/relatorio': 'seguranca-menu',

      // Tipo Justificativa
      '/dashboard/cadastro/tipo-justificativa': 'cadastro',

      // Escalas
      '/dashboard/cadastro/escala': 'cadastro',
    };

    // Adiciona a chave específica do submenu se existir
    const menuKey = routeToMenuKey[pathname];
    if (menuKey) {
      openKeys.push(menuKey);
    }

    return openKeys;
  };

  /**
   * Estrutura hierárquica dos itens do menu
   *
   * Define toda a árvore de navegação da aplicação com ícones,
   * labels, links e submenus organizados hierarquicamente.
   *
   * ESTRUTURA:
   * - key: Identificador único (usado para selectedKeys e openKeys)
   * - icon: Ícone do Ant Design
   * - label: Texto ou componente Link para navegação
   * - children: Array de subitens (para submenus)
   *
   * NAVEGAÇÃO:
   * - Links usam Next.js Link para navegação client-side
   * - Keys correspondem às rotas para destacamento automático
   * - Hierarquia suporta múltiplos níveis de aninhamento
   */
  const items = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link href='/dashboard'>Dashboard</Link>,
    },
    {
      key: 'cadastro',
      icon: <FormOutlined />,
      label: 'Cadastro',
      children: [
        {
          icon: <FileProtectOutlined />,
          key: '/dashboard/cadastro/contrato',
          label: <Link href='/dashboard/cadastro/contrato'>Contratos</Link>,
        },
        {
          key: 'escalas-cadastro-menu',
          label: 'Escalas',
          icon: <CalendarOutlined />,
          children: [
            {
              key: '/dashboard/cadastro/tipo-escala',
              label: <Link href='/dashboard/cadastro/tipo-escala'>Tipos de Escala</Link>,
            },
            {
              key: '/dashboard/cadastro/horario-equipe',
              label: <Link href='/dashboard/cadastro/horario-equipe'>Catálogo de Horários</Link>,
            },
          ]
        },
        {
          key: 'equipe-menu',
          label: 'Equipe',
          icon: <TeamOutlined />,
          children: [
            {
              key: '/dashboard/cadastro/tipo-equipe',
              label: <Link href='/dashboard/cadastro/tipo-equipe'>Tipos de Equipe</Link>,
            },
            {
              key: '/dashboard/cadastro/equipe',
              label: <Link href='/dashboard/cadastro/equipe'>Equipes</Link>,
            },
          ]
        },
        {
          key: 'veiculos-menu',
          label: 'Veículos',
          icon: <CarOutlined />,
          children: [
            {
              key: '/dashboard/cadastro/tipo-veiculo',
              label: <Link href='/dashboard/cadastro/tipo-veiculo'>Tipos de Veículo</Link>,
            },
            {
              key: '/dashboard/cadastro/veiculo',
              label: (
                <Link href='/dashboard/cadastro/veiculo'>Veículos</Link>
              ),
            },
          ],
        },
        {
          key: '/dashboard/cadastro/cargo',
          label: <Link href='/dashboard/cadastro/cargo'>Cargos</Link>,
        },
        {
          key: '/dashboard/cadastro/eletricista',
          label: <Link href='/dashboard/cadastro/eletricista'>Eletricista</Link>,
        },
        {
          key: '/dashboard/cadastro/supervisor',
          label: <Link href='/dashboard/cadastro/supervisor'>Supervisor</Link>,
        },
        {
          key: '/dashboard/cadastro/tipo-atividade',
          label: <Link href='/dashboard/cadastro/tipo-atividade'>Tipo de Atividade</Link>,
        },
        {
          key: '/dashboard/cadastro/base',
          label: <Link href='/dashboard/cadastro/base'>Base</Link>,
        },
        {
          key: '/dashboard/cadastro/tipo-justificativa',
          label: <Link href='/dashboard/cadastro/tipo-justificativa'>Tipos de Justificativa</Link>,
        },


        {
          key: 'apr',
          icon: <FileProtectOutlined />,
          label: 'APR',
          children: [
            {
              key: '/dashboard/cadastro/apr-pergunta',
              label: <Link href='/dashboard/cadastro/apr-pergunta'>Perguntas</Link>,
            },
            {
              key: '/dashboard/cadastro/apr-opcao-resposta',
              label: <Link href='/dashboard/cadastro/apr-opcao-resposta'>Opções de Resposta</Link>,
            },
            {
              key: '/dashboard/cadastro/apr-modelo',
              label: <Link href='/dashboard/cadastro/apr-modelo'>Modelo</Link>,
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
              label: <Link href='/dashboard/cadastro/tipo-checklist'>Tipo de Checklist</Link>,
            },

            {
              key: '/dashboard/cadastro/checklist-pergunta',
              label: <Link href='/dashboard/cadastro/checklist-pergunta'>Perguntas</Link>,
            },
            {
              key: '/dashboard/cadastro/checklist-opcao-resposta',
              label: <Link href='/dashboard/cadastro/checklist-opcao-resposta'>Opções de Resposta</Link>,
            },
            {
              key: '/dashboard/cadastro/checklist-modelo',
              label: <Link href='/dashboard/cadastro/checklist-modelo'>Checklist</Link>,
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
              label: <Link href='/dashboard/cadastro/usuario'>Usuários Web</Link>,
            },
            {
              key: '/dashboard/cadastro/usuario-mobile',
              label: <Link href='/dashboard/cadastro/usuario-mobile'>Usuários Móveis</Link>,
            },
          ],
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
          label: <Link href='/dashboard/relatorios/bases'>Bases</Link>,
        },
        {
          key: '/dashboard/relatorios/veiculos',
          label: <Link href='/dashboard/relatorios/veiculos'>Veículos</Link>,
        },
        {
          key: '/dashboard/relatorios/equipes',
          label: <Link href='/dashboard/relatorios/equipes'>Equipes</Link>,
        },
        {
          key: '/dashboard/relatorios/eletricistas',
          label: <Link href='/dashboard/relatorios/eletricistas'>Eletricistas</Link>,
        },
        {
          key: '/dashboard/relatorios/escalas',
          label: <Link href='/dashboard/relatorios/escalas'>Escalas</Link>,
        },
        {
          key: '/dashboard/relatorios/turnos-por-periodo',
          label: <Link href='/dashboard/relatorios/turnos-por-periodo'>Turnos por Período</Link>,
        },
        {
          key: '/dashboard/relatorios/aderencia-equipe',
          label: <Link href='/dashboard/relatorios/aderencia-equipe'>Aderência de Equipes</Link>,
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
          label: <Link href='/dashboard/turnos'>Visão Geral</Link>,
        },
        {
          key: '/dashboard/historico',
          label: <Link href='/dashboard/historico'>Histórico</Link>,
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
          label: <Link href='/dashboard/frequencia/visao-geral'>Visão Geral</Link>,
        },
        {
          key: '/dashboard/frequencia/faltas',
          label: <Link href='/dashboard/frequencia/faltas'>Faltas</Link>,
        },
        {
          key: '/dashboard/frequencia/horas-extras',
          label: <Link href='/dashboard/frequencia/horas-extras'>Horas Extras</Link>,
        },
        {
          key: '/dashboard/frequencia/justificativas-equipe',
          label: <Link href='/dashboard/frequencia/justificativas-equipe'>Justificativas de Equipe</Link>,
        },
        {
          key: '/dashboard/frequencia/reconciliacao-manual',
          label: <Link href='/dashboard/frequencia/reconciliacao-manual'>Reconciliação Manual</Link>,
        },
      ],
    },
    {
      key: 'escalas-menu',
      icon: <CalendarOutlined />,
      label: 'Escalas',
      children: [
        {
          key: '/dashboard/cadastro/escala-equipe-periodo',
          label: <Link href='/dashboard/cadastro/escala-equipe-periodo'>Gestão de Escala</Link>,
        },
        {
          key: '/dashboard/cadastro/equipe-horario',
          label: <Link href='/dashboard/cadastro/equipe-horario'>Associar Horário</Link>,
        },
        {
          key: '/dashboard/escalas/edicao-em-curso',
          label: <Link href='/dashboard/escalas/edicao-em-curso'>Edição em Curso</Link>,
        },
      ],
    },
    {
      key: 'seguranca-menu',
      icon: <SafetyOutlined />,
      label: 'Segurança',
      children: [
        {
          key: '/dashboard/seguranca/checklists-pendentes',
          label: <Link href='/dashboard/seguranca/checklists-pendentes'>Tratamento de Pendências</Link>,
        },
        {
          key: '/dashboard/seguranca/relatorio',
          label: <Link href='/dashboard/seguranca/relatorio'>Relatório</Link>,
        },
      ],
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: (
        <span
          onClick={async () => {
            await signOut({
              callbackUrl: '/login',
              redirect: true
            });
          }}
        >
          Sair
        </span>
      ),
    },
  ];

  return (
    <Sider
      trigger={null}
      collapsible
      width={250}
      collapsed={collapsed}
      onCollapse={onCollapseChange}
      style={{
        height: '100vh',
        overflowY: 'auto',
        position: 'sticky',
        top: 0,
        backgroundColor: '#1D3557', // Mantém o tema azul do sidebar
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          margin: '16px 0',
        }}
      >
        <Image src='/logo.png' alt='NEXA' width={24} height={24} />
        <Title
          level={3}
          style={{
            color: '#F1FAEE',
            margin: 0,
          }}
        >
          NEXA
        </Title>
      </div>

      <Menu
        mode='inline'
        theme='dark'
        selectedKeys={[pathname]}
        defaultOpenKeys={getDefaultOpenKeys()}
        items={items}
        style={{
          background: 'transparent',
        }}
      />
    </Sider>
  );
};

/**
 * Export padrão do componente SidebarMenu
 *
 * Componente de menu lateral com expansão automática baseada na rota atual.
 * Mantém todas as funcionalidades existentes e adiciona comportamento inteligente
 * de expansão de menus para melhorar a experiência do usuário.
 *
 * FUNCIONALIDADES ADICIONADAS:
 * - Expansão automática da cadeia de menus até a página atual
 * - Mapeamento inteligente de rotas para chaves de menu
 * - Comentários JSDoc completos seguindo padrão do projeto
 * - Preservação de todas as funcionalidades existentes
 */
export default SidebarMenu;
