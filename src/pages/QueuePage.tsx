import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, Tag, Select, Slider, Space, Typography } from "antd";
import { apiClient } from "../api/client";
import { AlertDrawer } from "../components/AlertDrawer";
import { AppLayout } from "../components/AppLayout";

interface Alert {
  id: string;
  ruleLevel: number;
  ruleDescription: string | null;
  alertTime: string | null;
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [minScore, setMinScore] = useState<number>(0);
  const [timeSort, setTimeSort] = useState<"ASC" | "DESC">("DESC");

  const { data, isLoading, error } = useQuery({
    queryKey: ["alerts", page, limit, statusFilter, minScore, timeSort],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse>("/alerts", {
        params: {
          page,
          limit,
          status: statusFilter,
          minScore: minScore > 0 ? minScore : undefined,
          timeSort,
        },
      });
      return response.data;
    },
  });

  const columns = [
    {
      title: "Time",
      dataIndex: "alertTime",
      key: "alertTime",
      sorter: true,
      render: (value: string | null) => {
        if (!value) return "-";
        return new Date(value).toLocaleString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      },
    },
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

  const handleStatusChange = (value: string | undefined) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleScoreChange = (value: number) => {
    setMinScore(value);
    setPage(1);
  };

  return (
    <AppLayout>
      {/* Filters */}
      <Space style={{ marginBottom: 16 }} size="large">
        <div>
          <Typography.Text style={{ marginRight: 8 }}>Status</Typography.Text>
          <Select
            allowClear
            placeholder="All statuses"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={handleStatusChange}
            options={[
              { value: "open", label: "Open" },
              { value: "reviewed", label: "Reviewed" },
              { value: "false_positive", label: "False positive" },
              { value: "escalated", label: "Escalated" },
            ]}
          />
        </div>
        <div>
          <Typography.Text style={{ marginRight: 8 }}>
            Min score: {minScore.toFixed(2)}
          </Typography.Text>
          <Slider
            style={{ width: 160 }}
            min={0}
            max={1}
            step={0.05}
            value={minScore}
            onChange={handleScoreChange}
          />
        </div>
      </Space>
      {/* Table */}
      <Table
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        onChange={(_, __, sorter) => {
          if (!Array.isArray(sorter) && sorter.field === "alertTime") {
            setTimeSort(sorter.order === "ascend" ? "ASC" : "DESC");
            setPage(1);
          }
        }}
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
    </AppLayout>
  );
}
