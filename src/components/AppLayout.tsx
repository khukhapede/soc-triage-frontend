import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Layout, Menu, Switch, Button } from "antd";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/ThemeContext";

const { Header, Content } = Layout;

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { key: "/", label: "Queue" },
  // Chapter 7: add more pages here, e.g. { key: '/metrics', label: 'Metrics' }
];

export function AppLayout({ children }: AppLayoutProps) {
  const { logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            color: "white",
            fontWeight: 600,
            marginRight: 32,
            whiteSpace: "nowrap",
          }}
        >
          SOC Triage
        </div>

        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={navItems}
          style={{ flex: 1, minWidth: 0 }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Switch
            checked={mode === "dark"}
            onChange={toggleTheme}
            checkedChildren="Dark"
            unCheckedChildren="Light"
          />
          <Button onClick={logout}>Log out</Button>
        </div>
      </Header>

      <Content style={{ padding: 24 }}>{children}</Content>
    </Layout>
  );
}
