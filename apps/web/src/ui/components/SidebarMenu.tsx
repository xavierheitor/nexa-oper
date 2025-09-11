'use client';

import {
  BugOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  FileProtectOutlined,
  FormOutlined,
  LogoutOutlined,
  UserOutlined,
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
          key: '/dashboard/contrato',
          label: <Link href='/dashboard/contrato'>Contratos</Link>,
        },
        {
          key: '/dashboard/tipo-veiculo',
          label: <Link href='/dashboard/tipo-veiculo'>Tipos de Veículo</Link>,
        },
        {
          key: '/dashboard/tipo-equipe',
          label: <Link href='/dashboard/tipo-equipe'>Tipos de Equipe</Link>,
        },
        {
          key: '/dashboard/equipe',
          label: <Link href='/dashboard/equipe'>Equipes</Link>,
        },
        {
          key: '/dashboard/veiculo',
          label: <Link href='/dashboard/veiculo'>Veículos</Link>,
        },
        {
          key: '/dashboard/eletricista',
          label: <Link href='/dashboard/eletricista'>Eletricista</Link>,
        },
        {
          key: '/dashboard/equipamento',
          label: <Link href='/dashboard/equipamento'>Equipamento</Link>,
        },
        {
          key: 'defeitos',
          label: 'Defeitos',
          icon: <BugOutlined />,
          children: [
            {
              key: '/dashboard/grupoDefeitoEquipamento',
              label: (
                <Link href='/dashboard/grupoDefeitoEquipamento'>Grupo Defeito Equipamento</Link>
              ),
            },
            {
              key: '/dashboard/subgrupoDefeitoEquipamento',
              label: (
                <Link href='/dashboard/subgrupoDefeitoEquipamento'>
                  Subgrupo Defeito Equipamento
                </Link>
              ),
            },
            {
              key: '/dashboard/defeito',
              label: <Link href='/dashboard/defeito'>Defeito</Link>,
            },
          ],
        },
        {
          key: 'PMA',
          label: 'Plano de Manutenção',
          icon: <BugOutlined />,
          children: [
            {
              key: '/dashboard/tipoManutencao',
              label: <Link href='/dashboard/tipoManutencao'>Tipo de Manutenção</Link>,
            },
            {
              key: '/dashboard/kpi',
              label: <Link href='/dashboard/kpi'>KPI</Link>,
            },
            {
              key: '/dashboard/notasPMA',
              label: <Link href='/dashboard/notasPMA'>Notas PMA</Link>,
            },
          ],
        },
        {
          key: 'atividades',
          label: 'Atividades',
          icon: <BugOutlined />,
          children: [
            {
              key: '/dashboard/tipoAtividade',
              label: <Link href='/dashboard/tipoAtividade'>Tipo de Atividade</Link>,
            },
            {
              key: '/dashboard/atividade',
              label: <Link href='/dashboard/atividade'>Atividade</Link>,
            },
            {
              key: '/dashboard/atividadeAtribuicao',
              label: <Link href='/dashboard/atividadeAtribuicao'>Atribuição de Atividade</Link>,
            },
          ],
        },

        {
          key: 'apr',
          icon: <FileProtectOutlined />,
          label: 'APR',
          children: [
            {
              key: '/dashboard/aprModelo',
              label: <Link href='/dashboard/aprModelo'>Modelo</Link>,
            },
            {
              key: '/dashboard/aprPergunta',
              label: <Link href='/dashboard/aprPergunta'>Perguntas</Link>,
            },
          ],
        },
        {
          key: 'checklist',
          icon: <CheckCircleOutlined />,
          label: 'Checklist',
          children: [
            {
              key: '/dashboard/checklistModelo',
              label: <Link href='/dashboard/checklistModelo'>Modelo</Link>,
            },
            {
              key: '/dashboard/checklistPergunta',
              label: <Link href='/dashboard/checklistPergunta'>Perguntas</Link>,
            },
          ],
        },
        {
          key: '/dashboard/tecnico',
          label: <Link href='/dashboard/tecnico'>Técnico</Link>,
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
