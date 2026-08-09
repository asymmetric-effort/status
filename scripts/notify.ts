// Notification placeholder.
// Future versions will send notifications to configured channels
// (Slack, Discord, etc.) using GitHub secrets.

function main(): void {
  console.log("Notifications: no channels configured (placeholder).");
}

const isMain = process.argv[1]?.endsWith("notify.ts");
if (isMain) {
  main();
}
