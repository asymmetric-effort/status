import { createElement, useState, useCallback } from "@asymmetric-effort/specifyjs";
import { useStatus } from "../hooks/useStatus.ts";
import { useHistory } from "../hooks/useHistory.ts";
import { useVersion } from "../hooks/useVersion.ts";
import { Header } from "./Header.ts";
import { ServiceCard } from "./ServiceCard.ts";
import { Histogram } from "./Histogram.ts";
import { Footer } from "./Footer.ts";

export function App() {
  const { data, error, loading } = useStatus();
  const history = useHistory();
  const { version } = useVersion();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const handleServiceClick = useCallback((name: string) => {
    setSelectedService(name);
  }, []);

  const handleCloseHistogram = useCallback(() => {
    setSelectedService(null);
  }, []);

  if (loading) {
    return createElement("div", { className: "container" },
      createElement("div", { className: "loading" }, "Loading status...")
    );
  }

  if (error) {
    return createElement("div", { className: "container" },
      createElement("div", { className: "error" }, `Failed to load status: ${error}`)
    );
  }

  if (!data) {
    return createElement("div", { className: "container" },
      createElement("div", { className: "error" }, "No status data available.")
    );
  }

  const hasServices = data.services.length > 0;

  const showHistogram = selectedService
    && history.data
    && history.data.services[selectedService];

  return createElement("div", { className: "container" },
    createElement(Header as any, { title: data.title || "Status", services: data.services }),
    hasServices
      ? createElement("main", { className: "services" },
          ...data.services.map((service) =>
            createElement(ServiceCard as any, {
              key: service.name,
              service,
              onClick: () => handleServiceClick(service.name),
            })
          )
        )
      : createElement("main", { className: "services" },
          createElement("div", { className: "no-services" }, "No services configured.")
        ),
    showHistogram
      ? (() => {
          const svc = data.services.find((s) => s.name === selectedService);
          return createElement(Histogram as any, {
            serviceName: selectedService,
            hours: history.data!.services[selectedService!],
            startTime: history.data!.startTime,
            currentStatus: svc?.status || "up",
            currentMessage: svc?.message || "",
            messages: history.data!.messages?.[selectedService!] || [],
            onClose: handleCloseHistogram,
          });
        })()
      : null,
    createElement(Footer as any, { version })
  );
}
