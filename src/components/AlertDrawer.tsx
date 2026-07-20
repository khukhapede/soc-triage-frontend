import { useEffect } from "react";
import {
  Drawer,
  Tag,
  Descriptions,
  Form,
  Select,
  Input,
  Button,
  Spin,
  message,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";

interface AlertDetail {
  id: string;
  ruleLevel: number;
  ruleDescription: string | null;
  agentName: string | null;
  rawPayload: { full_log?: string };
  score?: {
    severityScore: number;
    techniqueScore: number;
    frequencyScore: number;
    finalScore: number;
  };
  disposition?: {
    status: string;
    analyst: string | null;
    notes: string | null;
  };
  alertTechniques?: {
    technique: { techniqueId: string; tactic: string; name: string };
  }[];
}

interface DispositionFormValues {
  status: string;
  notes?: string;
}

interface AlertDrawerProps {
  alertId: string | null;
  open: boolean;
  onClose: () => void;
}

export function AlertDrawer({ alertId, open, onClose }: AlertDrawerProps) {
  const [form] = Form.useForm<DispositionFormValues>();
  const queryClient = useQueryClient();

  const { data: alert, isLoading } = useQuery({
    queryKey: ["alert", alertId],
    queryFn: async () => {
      const response = await apiClient.get<AlertDetail>(`/alerts/${alertId}`);
      return response.data;
    },
    enabled: !!alertId && open,
  });

  useEffect(() => {
    if (alert) {
      form.setFieldsValue({
        status: alert.disposition?.status ?? "open",
        notes: alert.disposition?.notes ?? "",
      });
    }
  }, [alert, form]);

  const mutation = useMutation({
    mutationFn: async (values: DispositionFormValues) => {
      return apiClient.post(`/alerts/${alertId}/disposition`, values);
    },
    onSuccess: () => {
      message.success("Disposition updated");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert", alertId] });
    },
    onError: () => {
      message.error("Failed to update disposition. Please try again.");
    },
  });

  const onFinish = (values: DispositionFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Drawer title="Alert detail" open={open} onClose={onClose} width={420}>
      {isLoading || !alert ? (
        <Spin />
      ) : (
        <>
          <p style={{ fontWeight: 500, marginBottom: 4 }}>
            {alert.ruleDescription}
          </p>
          <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
            {alert.agentName ?? "Unknown agent"}
          </p>

          <div style={{ marginBottom: 16 }}>
            {alert.alertTechniques?.length ? (
              alert.alertTechniques.map((at) => (
                <Tag color="red" key={at.technique.techniqueId}>
                  {at.technique.techniqueId} — {at.technique.name}
                </Tag>
              ))
            ) : (
              <Tag>No MITRE mapping</Tag>
            )}
          </div>

          <Descriptions
            column={1}
            size="small"
            bordered
            style={{ marginBottom: 16 }}
          >
            <Descriptions.Item label="Severity">
              {alert.score?.severityScore.toFixed(2) ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Technique">
              {alert.score?.techniqueScore.toFixed(2) ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Frequency">
              {alert.score?.frequencyScore.toFixed(2) ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Final score">
              {alert.score?.finalScore.toFixed(2) ?? "-"}
            </Descriptions.Item>
          </Descriptions>

          {alert.rawPayload?.full_log && (
            <pre
              style={{
                background: "var(--surface-1)",
                padding: 8,
                borderRadius: 6,
                fontSize: 12,
                whiteSpace: "pre-wrap",
                marginBottom: 16,
              }}
            >
              {alert.rawPayload.full_log}
            </pre>
          )}

          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Disposition"
              name="status"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: "open", label: "Open" },
                  { value: "reviewed", label: "Reviewed" },
                  { value: "false_positive", label: "False positive" },
                  { value: "escalated", label: "Escalated" },
                ]}
              />
            </Form.Item>
            <Form.Item label="Notes" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={mutation.isPending}
            >
              Submit
            </Button>
          </Form>
        </>
      )}
    </Drawer>
  );
}
