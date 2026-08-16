import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  let contents = "";

  try {
    contents = readFileSync(filePath, "utf8");
  } catch {
    return;
  }

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const withoutExport = trimmed.startsWith("export ")
      ? trimmed.slice(7).trim()
      : trimmed;
    const separatorIndex = withoutExport.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = withoutExport.slice(0, separatorIndex).trim();
    let value = withoutExport.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));

const port = process.env.PORT;
if (!port) {
  console.error("PORT is not set in .env");
  process.exit(1);
}

const command = process.argv[2];
if (!command) {
  console.error("Usage: node scripts/run-next.mjs <dev|start> [...args]");
  process.exit(1);
}

const nextBin = resolve(process.cwd(), "node_modules/next/dist/bin/next");
const child = spawn(
  process.execPath,
  [nextBin, command, "-p", port, ...process.argv.slice(3)],
  {
    stdio: "inherit",
    env: process.env,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
