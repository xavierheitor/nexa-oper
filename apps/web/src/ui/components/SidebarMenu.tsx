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
 *   - Equipe (submenu: Tipos, Equipes)
 *   - Veículos (submenu: Tipos, Veículos)
 *   - Eletricista, Supervisor, Tipo de Atividade, Base
 *   - APR (submenu: Perguntas, Opções, Modelo)
 *   - Checklist (submenu: Tipo, Perguntas, Opções, Modelo)
 *   - Usuários (submenu: Web, Móveis)
 * - PMA, Anomalias
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
  CalendarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  FileProtectOutlined,
  FormOutlined,
  LogoutOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Layout, Menu, Typography } from 'antd';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

    // Mapeamento de rotas para suas chaves de menu pai
    const routeToMenuKey: Record<string, string> = {
      // Submenus de Equipe
      '/dashboard/cadastro/tipo-equipe': 'equipe-menu',
      '/dashboard/cadastro/equipe': 'equipe-menu',

      // Submenus de Veículos
      '/dashboard/cadastro/tipo-veiculo': 'veiculos-menu',
      '/dashboard/cadastro/veiculo': 'veiculos-menu',

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
          icon: <CalendarOutlined />,
          key: '/dashboard/cadastro/escala',
          label: <Link href='/dashboard/cadastro/escala'>Escalas</Link>,
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
      key: '/dashboard/pma',
      icon: <FormOutlined />,
      label: <Link href='/dashboard/pma'>Plano de Manutenção</Link>,
    },
    {
      key: '/dashboard/anomalias',
      icon: <FormOutlined />,
      label: <Link href='/dashboard/anomalias'>Anomalias</Link>,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <span onClick={() => signOut({ callbackUrl: '/' })}>Sair</span>,
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
      <Title
        level={3}
        style={{
          color: '#F1FAEE',
          textAlign: 'center',
          margin: '16px 0',
        }}
      >
        SYMPLA
      </Title>

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
