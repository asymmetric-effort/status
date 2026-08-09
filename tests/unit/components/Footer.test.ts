import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { renderToString } from "@asymmetric-effort/specifyjs/server";
import { createElement } from "@asymmetric-effort/specifyjs";
import { Footer } from "../../../src/components/Footer.ts";

describe("Footer", () => {
  it("renders copyright text", () => {
    const html = renderToString(createElement(Footer as any, null));
    expect(html).toContain("\u00A9 2025 Asymmetric Effort, LLC. MIT LICENSE");
  });

  it("renders a footer element", () => {
    const html = renderToString(createElement(Footer as any, null));
    expect(html).toContain("<footer");
  });

  it("includes the year 2025", () => {
    const html = renderToString(createElement(Footer as any, null));
    expect(html).toContain("2025");
  });

  it("includes MIT LICENSE", () => {
    const html = renderToString(createElement(Footer as any, null));
    expect(html).toContain("MIT LICENSE");
  });
});
