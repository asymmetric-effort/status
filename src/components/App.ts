import { createElement } from "@asymmetric-effort/specifyjs";
import { useStatus } from "../hooks/useStatus.ts";
import { Header } from "./Header.ts";
import { ServiceCard } from "./ServiceCard.ts";
import { Footer } from "./Footer.ts";

export function App() {
  const { data, error, loading } = useStatus();

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

  return createElement("div", { className: "container" },
    createElement(Header as any, { title: data.title, services: data.services }),
    createElement("main", { className: "services" },
      ...data.services.map((service) =>
        createElement(ServiceCard as any, { key: service.name, service })
      )
    ),
    createElement(Footer as any, null)
  );
}
