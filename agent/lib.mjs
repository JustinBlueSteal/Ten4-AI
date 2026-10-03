// Shared helpers for the Ten4 Text agent scripts. Node 18+, zero dependencies.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DUTIES_DIR = path.join(ROOT, "agent", "duties");
export const LOGS_DIR = path.join(ROOT, "agent", "logs");
export const LESSONS = path.join(ROOT, "agent", "knowledge", "lessons.md");
const WIN = process.platform === "win32";

/** Load KEY=VALUE pairs from a .env file into process.env (does not override existing variables). */
export function loadEnv(file = path.join(ROOT, ".env")) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m || line.trim().startsWith("#")) continue;
    const v = m[2].replace(/^["']|["']$/g, "");
    if (!(m[1] in process.env) && v) process.env[m[1]] = v;
  }
}

/** Run a command to completion. npm/npx are .cmd files on Windows, so they need a shell there. */
export function run(cmd, args, opts = {}) {
  const needsShell = WIN && /^(npm|npx)$/.test(cmd);
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd ?? ROOT,
    encoding: "utf8",
    shell: needsShell,
    maxBuffer: 64 * 1024 * 1024,
    timeout: opts.timeoutMs,
    env: process.env,
  });
  return {
    code: r.status ?? (r.error ? 127 : 1),
    out: `${r.stdout ?? ""}${r.stderr ?? ""}`,
    error: r.error,
  };
}
export const git = (...args) => run("git", args);

export function stamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
}

/** Parse a duty file: a tiny `key: value` header between --- lines, then the plain-English instructions. */
export function parseDuty(file) {
  const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${path.basename(file)}: missing --- header`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-z_]+):\s*(.*?)\s*(?:\s#.*)?$/);
    if (kv) meta[kv[1]] = kv[2];
  }
  if (!meta.id) throw new Error(`${path.basename(file)}: header needs an id`);
  const list = (s) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);
  return {
    id: meta.id,
    title: meta.title || meta.id,
    schedule: meta.schedule || "manual",
    gate: meta.gate === "none" ? [] : list(meta.gate || "backend,mobile"),
    files: list(meta.files),
    runIf: meta.run_if || "",
    body: m[2].trim(),
    file,
  };
}

export function listDuties() {
  if (!fs.existsSync(DUTIES_DIR)) return [];
  return fs
    .readdirSync(DUTIES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseDuty(path.join(DUTIES_DIR, f)));
}

export function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

/** Tiny argv parser: --flag, --key value, and bare words collected as `_`. */
export function parseArgs(argv, valueFlags = []) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      if (valueFlags.includes(k)) out[k] = argv[++i];
      else out[k] = true;
    } else out._.push(a);
  }
  return out;
}
