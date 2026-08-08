import { createElement } from "@asymmetric-effort/specifyjs";
import type { ServiceStatus } from "../types.ts";

interface StatusBadgeProps {
  status: ServiceStatus;
}

const STATUS_LABELS: Record<ServiceStatus, string> = {
  up: "Operational",
  degraded: "Degraded",
  down: "Down",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = STATUS_LABELS[status];
  return createElement("span", { className: `status-badge status-${status}` }, label);
}
