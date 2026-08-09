import { createElement } from "@asymmetric-effort/specifyjs";
import type { Service } from "../types.ts";
import { StatusBadge } from "./StatusBadge.ts";

interface ServiceCardProps {
  service: Service;
  onClick: () => void;
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;

  if (isNaN(then)) return "Unknown";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export { formatRelativeTime };

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  return createElement("div", {
      className: `service-card service-card-${service.status}`,
      onClick,
      role: "button",
      tabIndex: 0,
    },
    createElement("div", { className: "service-info" },
      createElement("span", { className: "service-name" }, service.name),
      createElement("span", { className: "service-message" }, service.message)
    ),
    createElement("div", { className: "service-status" },
      createElement(StatusBadge as any, { status: service.status }),
      createElement("span", { className: "service-updated" }, formatRelativeTime(service.updated))
    )
  );
}
