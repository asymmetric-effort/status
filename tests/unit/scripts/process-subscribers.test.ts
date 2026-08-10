import { describe, it, expect } from "@asymmetric-effort/nogginlessdom";
import { parseSubscriberYaml, isDuplicate, serializeTopicList } from "../../../scripts/process-subscribers.ts";
import type { Subscriber, TopicList } from "../../../scripts/process-subscribers.ts";

describe("parseSubscriberYaml", () => {
  it("parses email and topics", () => {
    const content = `email: "ops@example.com"
topics:
  - "website"
  - "api"
`;
    const result = parseSubscriberYaml(content);
    expect(result.email).toBe("ops@example.com");
    expect(result.topics).toHaveLength(2);
    expect(result.topics[0]).toBe("website");
    expect(result.topics[1]).toBe("api");
  });

  it("parses webhook subscriber", () => {
    const content = `webhook: "https://hooks.slack.com/xxx"
topics:
  - "api"
`;
    const result = parseSubscriberYaml(content);
    expect(result.webhook).toBe("https://hooks.slack.com/xxx");
    expect(result.topics).toHaveLength(1);
  });

  it("handles empty content", () => {
    const result = parseSubscriberYaml("");
    expect(result.email).toBeUndefined();
    expect(result.webhook).toBeUndefined();
    expect(result.topics).toHaveLength(0);
  });

  it("ignores comments", () => {
    const content = `# subscriber
email: "test@test.com"
# topics list
topics:
  - "web"
`;
    const result = parseSubscriberYaml(content);
    expect(result.email).toBe("test@test.com");
    expect(result.topics).toHaveLength(1);
  });
});

describe("isDuplicate", () => {
  it("detects duplicate email", () => {
    const list: TopicList = { subscribers: [{ email: "a@b.com" }] };
    expect(isDuplicate(list, { email: "a@b.com" })).toBe(true);
  });

  it("detects duplicate webhook", () => {
    const list: TopicList = { subscribers: [{ webhook: "https://hook" }] };
    expect(isDuplicate(list, { webhook: "https://hook" })).toBe(true);
  });

  it("returns false for new subscriber", () => {
    const list: TopicList = { subscribers: [{ email: "a@b.com" }] };
    expect(isDuplicate(list, { email: "c@d.com" })).toBe(false);
  });

  it("returns false for empty list", () => {
    const list: TopicList = { subscribers: [] };
    expect(isDuplicate(list, { email: "a@b.com" })).toBe(false);
  });
});

describe("serializeTopicList", () => {
  it("serializes email subscribers", () => {
    const list: TopicList = { subscribers: [{ email: "a@b.com" }, { email: "c@d.com" }] };
    const yaml = serializeTopicList(list);
    expect(yaml).toContain("subscribers:");
    expect(yaml).toContain('email: "a@b.com"');
    expect(yaml).toContain('email: "c@d.com"');
  });

  it("serializes webhook subscribers", () => {
    const list: TopicList = { subscribers: [{ webhook: "https://hook" }] };
    const yaml = serializeTopicList(list);
    expect(yaml).toContain('webhook: "https://hook"');
  });

  it("serializes empty list", () => {
    const list: TopicList = { subscribers: [] };
    const yaml = serializeTopicList(list);
    expect(yaml).toBe("subscribers:\n");
  });
});
