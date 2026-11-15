import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const probe = join(process.cwd(), "src", "app", "boundary-verification-probe");
if (existsSync(probe)) throw new Error("Boundary probe path already exists; refusing to overwrite.");
try {
  mkdirSync(probe);
  writeFileSync(join(probe, "page.tsx"), `"use client";
import { getBackendHealth } from "@/lib/server/backend";
export default function Probe() {
  return <button onClick={() => { void getBackendHealth("probe"); }}>Probe</button>;
}
`);
  const result = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
    encoding: "utf8", timeout: 120000, maxBuffer: 10 * 1024 * 1024,
  });
  const diagnostic = (result.stdout ?? "") + (result.stderr ?? "");
  if (result.status === 0 || !/server-only/.test(diagnostic) || !/Client Component|client component|Server Component/.test(diagnostic)) {
    throw new Error("Next.js did not reject the server-only client import as expected.");
  }
  console.log("Server-only import boundary verified by the Next.js compiler.");
} finally {
  rmSync(probe, { recursive: true, force: true });
}
