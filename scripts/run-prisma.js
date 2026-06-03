#!/usr/bin/env node

const { spawnSync } = require("child_process");

require("./load-env-local");

const args = process.argv.slice(2);

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set in .env.local");
  console.error("Add your Neon/PostgreSQL connection string, then run again.");
  process.exit(1);
}

const result = spawnSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
