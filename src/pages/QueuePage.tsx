import { useQuery } from "@tanstack/react-query";
import { Table, Tag, Layout, Button } from "antd";
import { apiClient } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const { Header, Content } = Layout;

interface Alert {
  id: string;
  ruleLevel: number;
  ruleDescription: string | null;
  score?: { finalScore: number };
  disposition?: { status: string };
}

export function QueuePage() {
  const { logout } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const response = await apiClient.get<Alert[]>("/alerts");
      return response.data;
    },
  });

  const columns = [
    {
      title: "Score",
      dataIndex: ["score", "finalScore"],
      key: "score",
      render: (value: number) => (value != null ? value.toFixed(2) : "-"),
    },
    {
      title: "Alert",
      dataIndex: "ruleDescription",
      key: "ruleDescription",
    },
    {
      title: "Status",
      dataIndex: ["disposition", "status"],
      key: "status",
      render: (status: string | undefined) => <Tag>{status ?? "open"}</Tag>,
    },
  ];

  return (
    <Layout>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "white" }}>SOC Triage Dashboard</span>
        <Button onClick={logout}>Log out</Button>
      </Header>
      <Content style={{ padding: 24 }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={isLoading}
        />
        {error && <p>Failed to load alerts.</p>}
      </Content>
    </Layout>
  );
}
