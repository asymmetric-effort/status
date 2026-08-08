import { createElement } from "@asymmetric-effort/specifyjs";

export function Footer() {
  return createElement("footer", { className: "footer" },
    createElement("p", null,
      "Powered by ",
      createElement("a", {
        href: "https://github.com/asymmetric-effort/status",
        target: "_blank",
        rel: "noopener noreferrer",
      }, "Bailfire")
    )
  );
}
