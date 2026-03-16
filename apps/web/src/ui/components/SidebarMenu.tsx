/**
 * Componente de Menu Lateral (Sidebar)
 *
 * Refatorado para separar configuração (dados), lógica e apresentação.
 *
 * MUDANÇAS RECENTES:
 * - Configuração de itens movida para @/lib/constants/navigation
 * - Lógica de expansão recursiva extraída para findOpenKeys
 * - Estilos extraídos para arquivo CSS
 */

'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Layout, Menu, Typography } from 'antd';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  filterMenuByPermissions,
  MENU_STRUCTURE,
  getAntdMenuItems,
  findOpenKeys,
} from '@/lib/constants/navigation';
import './sidebar-menu.css';

const { Sider } = Layout;
const { Title } = Typography;

interface SidebarMenuProps {
  collapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({
  collapsed,
  onCollapseChange,
}) => {
  const pathname = usePathname();
  const { user } = useAuth({ redirectToLogin: false });

  // Transforma a configuração estruturada em itens do Ant Design
  // usar useMemo se houver problemas de performance, mas para menus estáticos é overkill
  const visibleMenu = filterMenuByPermissions(
    MENU_STRUCTURE,
    user?.permissions || []
  );
  const menuItems = getAntdMenuItems(visibleMenu);

  // Calcula chaves abertas com base na rota atual
  const defaultOpenKeys = findOpenKeys(pathname, visibleMenu);

  return (
    <Sider
      trigger={null}
      collapsible
      width={250}
      collapsed={collapsed}
      onCollapse={onCollapseChange}
      className='sidebar-container'
    >
      <div className='logo-container'>
        <Image src='/logo.png' alt='NEXA' width={24} height={24} />
        {!collapsed && (
          <Title level={3} className='logo-title'>
            NEXA
          </Title>
        )}
      </div>

      <Menu
        mode='inline'
        theme='dark'
        // Usa pathname como selectedKey
        selectedKeys={[pathname]}
        // Chaves abertas (submenus)
        defaultOpenKeys={defaultOpenKeys}
        items={menuItems}
        className='menu-instance'
      />
    </Sider>
  );
};

export default SidebarMenu;
