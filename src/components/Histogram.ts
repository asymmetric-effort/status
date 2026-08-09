import { createElement } from "@asymmetric-effort/specifyjs";
import type { HistogramStatus, IncidentEntry } from "../hooks/useHistory.ts";

interface HistogramProps {
  serviceName: string;
  hours: HistogramStatus[];
  startTime: string;
  currentStatus: string;
  currentMessage: string;
  messages: IncidentEntry[];
  onClose: () => void;
}

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

function formatHour(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function getDayStatus(hourStatuses: HistogramStatus[]): HistogramStatus {
  if (hourStatuses.some((s) => s === "down")) return "down";
  if (hourStatuses.some((s) => s === "degraded")) return "degraded";
  if (hourStatuses.some((s) => s === "operational")) return "operational";
  return "no-data";
}

export function Histogram({ serviceName, hours, startTime, currentStatus, currentMessage, messages, onClose }: HistogramProps) {
  const start = new Date(startTime);

  // Build day boundary labels for date markers
  const dayLabels: Array<{ index: number; label: string }> = [];
  for (let h = 0; h < hours.length; h++) {
    if (h % 24 === 0) {
      const date = new Date(start.getTime() + h * 3600000);
      // Show label every 7 days to avoid crowding
      if (h % (24 * 7) === 0) {
        dayLabels.push({ index: h, label: formatDate(date) });
      }
    }
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
      createElement("div", { className: "histogram-chart-container" },
        createElement("div", { className: "histogram-chart" },
          ...hours.map((status, i) => {
            const hourDate = new Date(start.getTime() + i * 3600000);
            return createElement("div", {
              key: String(i),
              className: `histogram-bar histogram-${status}`,
              title: `${formatHour(hourDate)}: ${STATUS_LABELS[status]}`,
            });
          })
        ),
        createElement("div", { className: "histogram-date-markers" },
          ...dayLabels.map((dl) =>
            createElement("span", {
              key: String(dl.index),
              className: "histogram-date-label",
              style: `left:${(dl.index / hours.length) * 100}%`,
            }, dl.label)
          )
        )
      ),
      createElement("div", { className: "histogram-dates" },
        createElement("span", null, formatDate(start)),
        createElement("span", null, "Now")
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
      createElement("div", { className: "histogram-messages" },
        createElement("h3", null, "Messages"),
        messages.length > 0
          ? createElement("div", { className: "histogram-message-list" },
              ...messages.map((entry, i) =>
                createElement("div", {
                  key: String(i),
                  className: `histogram-message-entry histogram-message-${entry.status}`,
                },
                  createElement("div", { className: "histogram-message-meta" },
                    createElement("span", { className: "histogram-message-status" },
                      STATUS_LABELS[entry.status] || entry.status
                    ),
                    createElement("span", { className: "histogram-message-time" },
                      formatTimestamp(entry.timestamp)
                    )
                  ),
                  createElement("div", { className: "histogram-message-text" }, entry.message)
                )
              )
            )
          : createElement("p", { className: "histogram-no-messages" }, "No incident history.")
      )
    )
  );
}

export { getDayStatus, STATUS_LABELS, formatTimestamp, formatHour };
