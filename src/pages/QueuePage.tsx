import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, Tag, Layout, Button } from "antd";
import { apiClient } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AlertDrawer } from "../components/AlertDrawer";

const { Header, Content } = Layout;

interface Alert {
  id: string;
  ruleLevel: number;
  ruleDescription: string | null;
  score?: { finalScore: number };
  disposition?: { status: string };
}

interface PaginatedResponse {
  data: Alert[];
  total: number;
  page: number;
  limit: number;
}

export function QueuePage() {
  const { logout } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["alerts", page, limit],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse>("/alerts", {
        params: { page, limit },
      });
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
          dataSource={data?.data}
          rowKey="id"
          loading={isLoading}
          onRow={(record) => ({
            onClick: () => {
              setSelectedId(record.id);
              setDrawerOpen(true);
            },
            style: { cursor: "pointer" },
          })}
          pagination={{
            current: page,
            pageSize: limit,
            total: data?.total,
            onChange: (newPage, newLimit) => {
              setPage(newPage);
              setLimit(newLimit);
            },
          }}
        />
        <AlertDrawer
          alertId={selectedId}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
        {error && <p>Failed to load alerts.</p>}
      </Content>
    </Layout>
  );
}
