import { createElement } from "@asymmetric-effort/specifyjs";

export function Footer() {
  return createElement("footer", { className: "footer" },
    createElement("p", null, "\u00A9 2025 Asymmetric Effort, LLC. MIT LICENSE")
  );
}
