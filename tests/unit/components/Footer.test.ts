import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { renderToString } from "@asymmetric-effort/specifyjs/server";
import { createElement } from "@asymmetric-effort/specifyjs";
import { Footer } from "../../../src/components/Footer.ts";

describe("Footer", () => {
  it("renders 'Powered by' text", () => {
    const html = renderToString(createElement(Footer as any, null));
    expect(html).toContain("Powered by");
  });

  it("renders a link to the Bailfire repo", () => {
    const html = renderToString(createElement(Footer as any, null));
    expect(html).toContain("Bailfire");
    expect(html).toContain("https://github.com/asymmetric-effort/status");
  });

  it("renders a footer element", () => {
    const html = renderToString(createElement(Footer as any, null));
    expect(html).toContain("<footer");
  });

  it("opens link in new tab", () => {
    const html = renderToString(createElement(Footer as any, null));
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
