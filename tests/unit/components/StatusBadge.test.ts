import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { renderToString } from "@asymmetric-effort/specifyjs/server";
import { createElement } from "@asymmetric-effort/specifyjs";
import { StatusBadge } from "../../../src/components/StatusBadge.ts";

describe("StatusBadge", () => {
  it("renders 'Operational' for up status", () => {
    const html = renderToString(createElement(StatusBadge as any, { status: "up" }));
    expect(html).toContain("Operational");
    expect(html).toContain("status-up");
  });

  it("renders 'Degraded' for degraded status", () => {
    const html = renderToString(createElement(StatusBadge as any, { status: "degraded" }));
    expect(html).toContain("Degraded");
    expect(html).toContain("status-degraded");
  });

  it("renders 'Down' for down status", () => {
    const html = renderToString(createElement(StatusBadge as any, { status: "down" }));
    expect(html).toContain("Down");
    expect(html).toContain("status-down");
  });

  it("renders a span element with status-badge class", () => {
    const html = renderToString(createElement(StatusBadge as any, { status: "up" }));
    expect(html).toContain("<span");
    expect(html).toContain("status-badge");
  });
});
