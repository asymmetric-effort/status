import { createElement } from "@asymmetric-effort/specifyjs";

interface FooterProps {
  version: string;
}

export function Footer({ version }: FooterProps) {
  return createElement("footer", { className: "footer" },
    createElement("p", null,
      "\u00A9 2025 ",
      createElement("a", {
        href: "https://asymmetric-effort.com",
        target: "_blank",
        rel: "noopener noreferrer",
      }, "Asymmetric Effort, LLC"),
      ". MIT LICENSE"
    ),
    createElement("p", { className: "footer-version" }, version)
  );
}
