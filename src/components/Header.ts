import { createElement } from "@asymmetric-effort/specifyjs";
import type { Service } from "../types.ts";

interface HeaderProps {
  title: string;
  services: Service[];
}

function getOverallStatus(services: Service[]): { label: string; className: string } {
  if (services.length === 0) {
    return { label: "No Services Configured", className: "overall-none" };
  }
  const hasDown = services.some((s) => s.status === "down");
  const hasDegraded = services.some((s) => s.status === "degraded");

  if (hasDown) {
    return { label: "Major Outage", className: "overall-down" };
  }
  if (hasDegraded) {
    return { label: "Partial Outage", className: "overall-degraded" };
  }
  return { label: "All Systems Operational", className: "overall-up" };
}

export { getOverallStatus };

export function Header({ title, services }: HeaderProps) {
  const overall = getOverallStatus(services);
  return createElement("header", { className: "header" },
    createElement("h1", null, title),
    createElement("div", { className: `overall-status ${overall.className}` }, overall.label)
  );
}
