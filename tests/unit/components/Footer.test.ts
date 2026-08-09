import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { renderToString } from "@asymmetric-effort/specifyjs/server";
import { createElement } from "@asymmetric-effort/specifyjs";
import { Footer } from "../../../src/components/Footer.ts";

describe("Footer", () => {
  it("renders copyright text matching specifyjs format", () => {
    const html = renderToString(createElement(Footer as any, { version: "v0.0.0" }));
    expect(html).toContain("\u00A9 2025-2026 Asymmetric Effort, LLC. MIT License.");
  });

  it("renders a footer element", () => {
    const html = renderToString(createElement(Footer as any, { version: "v0.0.0" }));
    expect(html).toContain("<footer");
  });

  it("renders the version", () => {
    const html = renderToString(createElement(Footer as any, { version: "v1.0.0" }));
    expect(html).toContain("v1.0.0");
    expect(html).toContain("footer-version");
  });
});
