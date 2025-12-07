'use client';

import { useHydrated } from '@/lib/hooks/useHydrated';
import AuthGuard from '@/lib/components/AuthGuard';
import SidebarMenu from '@/ui/components/SidebarMenu';
import SessionRenewer from '@/ui/components/SessionRenewer';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Col, Layout, Row, Spin, theme } from 'antd';
import React, { useState } from 'react';

const { Header, Content } = Layout;

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const hydrated = useHydrated();

  const { token } = theme.useToken();

  if (!hydrated) {
    return (
      <Row
        justify='center'
        align='middle'
        style={{ height: '100vh', background: token.colorBgLayout }}
      >
        <Spin size='large' />
      </Row>
    );
  }

  return (
    <AuthGuard>
      <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
        {/* Componente invisível que renova a sessão automaticamente */}
        <SessionRenewer />

        <SidebarMenu collapsed={collapsed} onCollapseChange={setCollapsed} />

        <Layout>
          <Header
            style={{
              padding: `0 ${token.padding}px`,
              background: token.colorBgContainer,
            }}
          >
            <Row justify='space-between' align='middle'>
              <Col>
                <Button
                  type='text'
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
                  style={{
                    fontSize: token.fontSizeLG,
                    color: token.colorText,
                  }}
                />
              </Col>
              <Col>
                {/* <ThemeToggle /> */}
              </Col>
            </Row>
          </Header>

          <Content
            style={{
              margin: token.margin,
              padding: token.padding,
              background: token.colorBgContainer,
              borderRadius: token.borderRadiusLG,
              flex: 1,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </AuthGuard>
  );
};

export default AppLayout;
