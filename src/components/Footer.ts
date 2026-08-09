import { createElement } from "@asymmetric-effort/specifyjs";

interface FooterProps {
  version: string;
}

export function Footer({ version }: FooterProps) {
  return createElement("footer", { className: "footer" },
    createElement("p", null, `\u00A9 2025-2026 Asymmetric Effort, LLC. MIT License.`),
    createElement("p", { className: "footer-version" }, version)
  );
}
