import { createElement } from "@asymmetric-effort/specifyjs";
import type { HistogramStatus } from "../hooks/useHistory.ts";

interface HistogramProps {
  serviceName: string;
  hours: HistogramStatus[];
  startTime: string;
  currentStatus: string;
  currentMessage: string;
  onClose: () => void;
}

const STATUS_COLORS: Record<HistogramStatus, string> = {
  operational: "var(--color-up)",
  degraded: "var(--color-degraded)",
  down: "var(--color-down)",
  "no-data": "var(--color-border)",
};

const STATUS_LABELS: Record<HistogramStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
  "no-data": "No Data",
};

function formatDate(date: Date): string {
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}

function getDayStatus(hourStatuses: HistogramStatus[]): HistogramStatus {
  if (hourStatuses.some((s) => s === "down")) return "down";
  if (hourStatuses.some((s) => s === "degraded")) return "degraded";
  if (hourStatuses.some((s) => s === "operational")) return "operational";
  return "no-data";
}

export function Histogram({ serviceName, hours, startTime, currentStatus, currentMessage, onClose }: HistogramProps) {
  const start = new Date(startTime);

  // Group hours into days (90 days)
  const days: Array<{ date: Date; hours: HistogramStatus[]; overall: HistogramStatus }> = [];
  for (let d = 0; d < 90; d++) {
    const dayStart = d * 24;
    const dayHours = hours.slice(dayStart, dayStart + 24);
    const date = new Date(start.getTime() + d * 86400000);
    days.push({
      date,
      hours: dayHours,
      overall: getDayStatus(dayHours),
    });
  }

  // Calculate uptime percentage (excluding no-data hours)
  const dataHours = hours.filter((s) => s !== "no-data");
  const uptimeHours = dataHours.filter((s) => s === "operational").length;
  const uptimePercent = dataHours.length > 0
    ? ((uptimeHours / dataHours.length) * 100).toFixed(2)
    : "N/A";

  return createElement("div", { className: "histogram-overlay" },
    createElement("div", { className: "histogram-panel" },
      createElement("div", { className: "histogram-header" },
        createElement("h2", null, serviceName),
        createElement("button", {
          className: "histogram-close",
          onClick: onClose,
          "aria-label": "Close histogram",
        }, "\u2715")
      ),
      createElement("div", { className: "histogram-uptime" },
        `${uptimePercent}% uptime (past 90 days)`
      ),
      createElement("div", { className: "histogram-chart" },
        ...days.map((day, i) =>
          createElement("div", {
            key: String(i),
            className: `histogram-bar histogram-${day.overall}`,
            title: `${formatDate(day.date)}: ${STATUS_LABELS[day.overall]}`,
          })
        )
      ),
      createElement("div", { className: "histogram-dates" },
        createElement("span", null, formatDate(days[0].date)),
        createElement("span", null, "Today")
      ),
      createElement("div", { className: "histogram-legend" },
        ...Object.entries(STATUS_LABELS).map(([status, label]) =>
          createElement("div", { key: status, className: "histogram-legend-item" },
            createElement("span", {
              className: `histogram-legend-swatch histogram-${status}`,
            }),
            createElement("span", null, label)
          )
        )
      ),
      createElement("div", { className: `histogram-message histogram-message-${currentStatus}` },
        createElement("span", { className: "histogram-message-label" },
          STATUS_LABELS[(currentStatus === "up" ? "operational" : currentStatus) as HistogramStatus] || currentStatus
        ),
        createElement("span", { className: "histogram-message-text" }, currentMessage)
      )
    )
  );
}

export { getDayStatus, STATUS_LABELS };
