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

function getLastUpdated(services: Service[]): string {
  if (services.length === 0) return "";
  let latest = "";
  for (const svc of services) {
    if (svc.updated > latest) latest = svc.updated;
  }
  if (!latest) return "";
  const date = new Date(latest);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export { getLastUpdated };

export function Header({ title, services }: HeaderProps) {
  const overall = getOverallStatus(services);
  const lastUpdated = getLastUpdated(services);
  return createElement("header", { className: "banner" },
    createElement("div", { className: "banner-brand" },
      createElement("svg", {
        className: "banner-icon",
        viewBox: "0 0 48 48",
        width: "40",
        height: "40",
        "aria-hidden": "true",
      },
        // Mountain (grey)
        createElement("polygon", {
          points: "4,44 24,16 44,44",
          fill: "#9ca3af",
        }),
        createElement("polygon", {
          points: "14,44 24,28 34,44",
          fill: "#6b7280",
        }),
        // Fire (red/orange) on the peak
        createElement("ellipse", {
          cx: "24",
          cy: "14",
          rx: "6",
          ry: "8",
          fill: "#ef4444",
        }),
        createElement("ellipse", {
          cx: "24",
          cy: "12",
          rx: "4",
          ry: "6",
          fill: "#f97316",
        }),
        createElement("ellipse", {
          cx: "24",
          cy: "10",
          rx: "2",
          ry: "4",
          fill: "#fbbf24",
        }),
      ),
      createElement("h1", null, title),
    ),
    createElement("div", { className: `overall-status ${overall.className}` }, overall.label),
    lastUpdated
      ? createElement("div", { className: "banner-updated" }, `Last updated: ${lastUpdated}`)
      : null
  );
}
