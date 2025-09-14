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
 *   - Eletricista, Supervisor, Tipo de Atividade
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
   * // Para rota '/dashboard/apr-modelo'
   * // Retorna: ['cadastro', 'apr']
   *
   * // Para rota '/dashboard/equipe'  
   * // Retorna: ['cadastro', 'equipe-menu']
   */
  const getDefaultOpenKeys = (): string[] => {
    const openKeys: string[] = [];

    // Sempre abre 'cadastro' se a rota começar com /dashboard/ (exceto dashboard raiz)
    if (pathname.startsWith('/dashboard/') && pathname !== '/dashboard') {
      openKeys.push('cadastro');
    }

    // Mapeamento de rotas para suas chaves de menu pai
    const routeToMenuKey: Record<string, string> = {
      // Submenus de Equipe
      '/dashboard/tipo-equipe': 'equipe-menu',
      '/dashboard/equipe': 'equipe-menu',

      // Submenus de Veículos
      '/dashboard/tipo-veiculo': 'veiculos-menu',
      '/dashboard/veiculo': 'veiculos-menu',

      // Submenus de APR
      '/dashboard/apr-pergunta': 'apr',
      '/dashboard/apr-opcao-resposta': 'apr',
      '/dashboard/apr-modelo': 'apr',

      // Submenus de Checklist
      '/dashboard/tipo-checklist': 'checklist',
      '/dashboard/checklist-pergunta': 'checklist',
      '/dashboard/checklist-opcao-resposta': 'checklist',
      '/dashboard/checklist-modelo': 'checklist',

      // Submenus de Usuários
      '/dashboard/usuario': 'usuarios',
      '/dashboard/usuario-mobile': 'usuarios',
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
          key: '/dashboard/contrato',
          label: <Link href='/dashboard/contrato'>Contratos</Link>,
        },
        {
          key: 'equipe-menu',
          label: 'Equipe',
          icon: <TeamOutlined />,
          children: [
            {
              key: '/dashboard/tipo-equipe',
              label: <Link href='/dashboard/tipo-equipe'>Tipos de Equipe</Link>,
            },
            {
              key: '/dashboard/equipe',
              label: <Link href='/dashboard/equipe'>Equipes</Link>,
            },
          ]
        },
        {
          key: 'veiculos-menu',
          label: 'Veículos',
          icon: <CarOutlined />,
          children: [
            {
              key: '/dashboard/tipo-veiculo',
              label: <Link href='/dashboard/tipo-veiculo'>Tipos de Veículo</Link>,
            },
            {
              key: '/dashboard/veiculo',
              label: (
                <Link href='/dashboard/veiculo'>Veículos</Link>
              ),
            },
          ],
        },
        {
          key: '/dashboard/eletricista',
          label: <Link href='/dashboard/eletricista'>Eletricista</Link>,
        },
        {
          key: '/dashboard/supervisor',
          label: <Link href='/dashboard/supervisor'>Supervisor</Link>,
        },
        {
          key: '/dashboard/tipo-atividade',
          label: <Link href='/dashboard/tipo-atividade'>Tipo de Atividade</Link>,
        },


        {
          key: 'apr',
          icon: <FileProtectOutlined />,
          label: 'APR',
          children: [
            {
              key: '/dashboard/apr-pergunta',
              label: <Link href='/dashboard/apr-pergunta'>Perguntas</Link>,
            },
            {
              key: '/dashboard/apr-opcao-resposta',
              label: <Link href='/dashboard/apr-opcao-resposta'>Opções de Resposta</Link>,
            },
            {
              key: '/dashboard/apr-modelo',
              label: <Link href='/dashboard/apr-modelo'>Modelo</Link>,
            },
          ],
        },
        {
          key: 'checklist',
          icon: <CheckCircleOutlined />,
          label: 'Checklist',
          children: [
            {
              key: '/dashboard/tipo-checklist',
              label: <Link href='/dashboard/tipo-checklist'>Tipo de Checklist</Link>,
            },

            {
              key: '/dashboard/checklist-pergunta',
              label: <Link href='/dashboard/checklist-pergunta'>Perguntas</Link>,
            },
            {
              key: '/dashboard/checklist-opcao-resposta',
              label: <Link href='/dashboard/checklist-opcao-resposta'>Opções de Resposta</Link>,
            },
            {
              key: '/dashboard/checklist-modelo',
              label: <Link href='/dashboard/checklist-modelo'>Checklist</Link>,
            },
          ],
        },
        {
          key: 'usuarios',
          label: 'Usuários',
          icon: <UserOutlined />,
          children: [
            {
              key: '/dashboard/usuario',
              label: <Link href='/dashboard/usuario'>Usuários Web</Link>,
            },
            {
              key: '/dashboard/usuario-mobile',
              label: <Link href='/dashboard/usuario-mobile'>Usuários Móveis</Link>,
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
