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

interface SidebarMenuProps {
  collapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ collapsed, onCollapseChange }) => {
  const pathname = usePathname();

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
              key: '/dashboard/aprModelo',
              label: <Link href='/dashboard/aprModelo'>Modelo</Link>,
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
        defaultOpenKeys={[pathname.split('/').slice(0, 2).join('/')]}
        items={items}
        style={{
          background: 'transparent',
        }}
      />
    </Sider>
  );
};

export default SidebarMenu;
