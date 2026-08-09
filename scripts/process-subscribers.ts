import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

interface Subscriber {
  email?: string;
  webhook?: string;
}

interface TopicList {
  subscribers: Subscriber[];
}

function decryptFile(gpgFile: string): string {
  return execFileSync("gpg", [
    "--batch",
    "--yes",
    "--decrypt",
    gpgFile,
  ], { encoding: "utf-8" });
}

function encryptFile(content: string, outputFile: string, pubkeyFile: string): void {
  execFileSync("gpg", [
    "--encrypt",
    "--armor",
    "--trust-model", "always",
    "--recipient-file", pubkeyFile,
    "--output", outputFile,
  ], { input: content, encoding: "utf-8" });
}

function parseSubscriberYaml(content: string): { email?: string; webhook?: string; topics: string[] } {
  const result: { email?: string; webhook?: string; topics: string[] } = { topics: [] };
  let inTopics = false;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    if (trimmed.startsWith("email:")) {
      result.email = trimmed.replace(/^email:\s*"?/, "").replace(/"?\s*$/, "");
      inTopics = false;
      continue;
    }
    if (trimmed.startsWith("webhook:")) {
      result.webhook = trimmed.replace(/^webhook:\s*"?/, "").replace(/"?\s*$/, "");
      inTopics = false;
      continue;
    }
    if (trimmed === "topics:") {
      inTopics = true;
      continue;
    }
    if (inTopics && trimmed.startsWith("- ")) {
      result.topics.push(trimmed.slice(2).replace(/^"/, "").replace(/"$/, ""));
    }
  }

  return result;
}

function loadTopicList(gpgFile: string): TopicList {
  if (!existsSync(gpgFile)) {
    return { subscribers: [] };
  }
  const content = decryptFile(gpgFile);
  const subscribers: Subscriber[] = [];
  let current: Subscriber | null = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- email:") || trimmed.startsWith("- webhook:")) {
      if (current) subscribers.push(current);
      current = {};
    }
    if (current) {
      if (trimmed.startsWith("email:") || trimmed.startsWith("- email:")) {
        current.email = trimmed.replace(/^-?\s*email:\s*"?/, "").replace(/"?\s*$/, "");
      }
      if (trimmed.startsWith("webhook:") || trimmed.startsWith("- webhook:")) {
        current.webhook = trimmed.replace(/^-?\s*webhook:\s*"?/, "").replace(/"?\s*$/, "");
      }
    }
  }
  if (current) subscribers.push(current);

  return { subscribers };
}

function serializeTopicList(list: TopicList): string {
  const lines = ["subscribers:"];
  for (const sub of list.subscribers) {
    if (sub.email) {
      lines.push(`  - email: "${sub.email}"`);
    } else if (sub.webhook) {
      lines.push(`  - webhook: "${sub.webhook}"`);
    }
  }
  return lines.join("\n") + "\n";
}

function isDuplicate(list: TopicList, subscriber: Subscriber): boolean {
  return list.subscribers.some((existing) => {
    if (subscriber.email && existing.email) return existing.email === subscriber.email;
    if (subscriber.webhook && existing.webhook) return existing.webhook === subscriber.webhook;
    return false;
  });
}

function main(): void {
  const rootDir = resolve(import.meta.dirname, "..");
  const rawDir = resolve(rootDir, "subscribers/raw");
  const listsDir = resolve(rootDir, "subscribers/lists");
  const pubkeyFile = resolve(rootDir, "subscribers/subscribers.gpg.pub");

  mkdirSync(listsDir, { recursive: true });

  const rawFiles = readdirSync(rawDir)
    .filter((f) => f.endsWith(".gpg"))
    .sort();

  if (rawFiles.length === 0) {
    console.log("No raw subscriber files to process.");
    return;
  }

  console.log(`Processing ${rawFiles.length} raw subscriber file(s)...`);

  for (const file of rawFiles) {
    const filePath = resolve(rawDir, file);
    console.log(`  Decrypting: ${file}`);

    let content: string;
    try {
      content = decryptFile(filePath);
    } catch (err) {
      console.error(`  ERROR: Failed to decrypt ${file}: ${err}`);
      continue;
    }

    const subscriber = parseSubscriberYaml(content);

    if (!subscriber.email && !subscriber.webhook) {
      console.error(`  ERROR: ${file} has no email or webhook.`);
      continue;
    }

    if (subscriber.topics.length === 0) {
      console.error(`  ERROR: ${file} has no topics.`);
      continue;
    }

    const subRecord: Subscriber = subscriber.email
      ? { email: subscriber.email }
      : { webhook: subscriber.webhook };

    for (const topic of subscriber.topics) {
      const topicFile = resolve(listsDir, `${topic}.yaml.gpg`);
      const list = loadTopicList(topicFile);

      if (isDuplicate(list, subRecord)) {
        console.log(`  Skipping duplicate in ${topic}: ${subscriber.email || subscriber.webhook}`);
        continue;
      }

      list.subscribers.push(subRecord);
      const serialized = serializeTopicList(list);
      encryptFile(serialized, topicFile, pubkeyFile);
      console.log(`  Added to ${topic} (${list.subscribers.length} total)`);
    }

    // Delete processed raw file
    unlinkSync(filePath);
    console.log(`  Deleted: ${file}`);
  }

  console.log("Subscriber processing complete.");
}

export { parseSubscriberYaml, isDuplicate, serializeTopicList };
export type { Subscriber, TopicList };

const isMain = process.argv[1]?.endsWith("process-subscribers.ts");
if (isMain) {
  main();
}
