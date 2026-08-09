import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { renderToString } from "@asymmetric-effort/specifyjs/server";
import { createElement } from "@asymmetric-effort/specifyjs";
import { Footer } from "../../../src/components/Footer.ts";

describe("Footer", () => {
  it("renders copyright text", () => {
    const html = renderToString(createElement(Footer as any, { version: "v0.0.0" }));
    expect(html).toContain("2025");
    expect(html).toContain("MIT LICENSE");
  });

  it("renders a footer element", () => {
    const html = renderToString(createElement(Footer as any, { version: "v0.0.0" }));
    expect(html).toContain("<footer");
  });

  it("links Asymmetric Effort to their website", () => {
    const html = renderToString(createElement(Footer as any, { version: "v0.0.0" }));
    expect(html).toContain("https://asymmetric-effort.com");
    expect(html).toContain("Asymmetric Effort, LLC");
  });

  it("opens link in new tab", () => {
    const html = renderToString(createElement(Footer as any, { version: "v0.0.0" }));
    expect(html).toContain('target="_blank"');
  });

  it("renders the version", () => {
    const html = renderToString(createElement(Footer as any, { version: "v1.2.3" }));
    expect(html).toContain("v1.2.3");
    expect(html).toContain("footer-version");
  });
});
