#!/usr/bin/env node
// Ten4 Text agent runner. One duty = one small, gated, reviewable branch.
//   node agent/run.mjs <duty-id> [--push] [--pr] [--dry-run]
//   node agent/run.mjs --schedule nightly|weekly [--push] [--pr]
//   node agent/run.mjs --list | --doctor
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { ROOT, LOGS_DIR, LESSONS, loadEnv, run, git, stamp, listDuties, parseArgs } from "./lib.mjs";

loadEnv();
const args = parseArgs(process.argv.slice(2), ["schedule", "model"]);
const MODEL = args.model || process.env.AGENT_MODEL || "gemini/gemini-2.5-flash";
const AIDER = process.env.AIDER_CMD || "aider";
const AIDER_TIMEOUT_MS = Number(process.env.AGENT_TIMEOUT_MIN || 25) * 60_000;

// The agent may never edit these. Anything touching them is thrown away.
const PROTECTED = [/^agent\//, /^\.github\//, /^CONVENTIONS\.md$/, /^spec\.md$/, /^\.env/, /^\.gitignore$/, /^\.aider/];
// Paid-API SDKs are banned by spec.md section 4.
const BANNED_DEPS = /^\+.*"(openai|@anthropic-ai\/sdk)"/m;

const log = (...a) => console.log("[agent]", ...a);
fs.mkdirSync(LOGS_DIR, { recursive: true });

function verifiedCount() {
  const f = path.join(ROOT, "MILESTONES.md");
  if (!fs.existsSync(f)) return 0;
  return (fs.readFileSync(f, "utf8").match(/\*\*Status:\*\*\s*(verified|shipped)/g) || []).length;
}

function changedFiles() {
  const r = git("status", "--porcelain", "-uall");
  return r.out
    .split("\n")
    .filter(Boolean)
    .map((l) => l.slice(3).replace(/^"|"$/g, "").split(" -> ").pop());
}

function gate(dirs) {
  const results = [];
  for (const d of dirs) {
    const cwd = path.join(ROOT, d);
    if (!fs.existsSync(path.join(cwd, "package.json"))) {
      results.push({ dir: d, ok: false, out: `${d}/package.json not found` });
      continue;
    }
    if (!fs.existsSync(path.join(cwd, "node_modules"))) {
      log(`installing ${d} dependencies…`);
      run("npm", ["install", "--no-audit", "--no-fund"], { cwd, timeoutMs: 15 * 60_000 });
    }
    const r = run("npx", ["tsc", "--noEmit"], { cwd, timeoutMs: 5 * 60_000 });
    results.push({ dir: d, ok: r.code === 0, out: r.out.slice(-4000) });
  }
  return results;
}

function buildPrompt(duty) {
  const lessons = fs.existsSync(LESSONS) ? fs.readFileSync(LESSONS, "utf8") : "";
  return [
    `# Duty: ${duty.title}`,
    "",
    "You are the Ten4 Text developer agent. Follow CONVENTIONS.md exactly. The files spec.md, MILESTONES.md,",
    "CONVENTIONS.md and agent/knowledge/lessons.md are attached read-only for context.",
    "Do ONE small, complete piece of work for this duty, then stop. Real working code only: no mocks, no placeholders.",
    "If the duty cannot be done safely (missing info, needs a device, needs a paid service), change nothing and",
    "explain why in your final message.",
    "",
    "## Taught lessons (from Justin; these override your own habits)",
    lessons.trim() || "(none yet)",
    "",
    "## Your assignment",
    duty.body,
    "",
    "## Finish by",
    "Appending one dated line to the Changelog in MILESTONES.md describing what you changed.",
  ].join("\n");
}

function runAider(duty, promptFile, logFile) {
  return new Promise((resolve) => {
    const a = [
      "--model", MODEL,
      "--yes-always", "--no-auto-commits", "--no-check-update", "--analytics-disable",
      "--no-show-model-warnings", "--no-suggest-shell-commands", "--no-pretty",
      "--read", "spec.md", "--read", "MILESTONES.md", "--read", "CONVENTIONS.md",
      "--read", "agent/knowledge/lessons.md",
      "--message-file", path.relative(ROOT, promptFile),
      ...duty.files.flatMap((f) => ["--file", f]),
    ];
    let out = "";
    let child;
    try {
      child = spawn(AIDER, a, { cwd: ROOT, env: process.env });
    } catch (e) {
      return resolve({ code: 127, out: String(e) });
    }
    const timer = setTimeout(() => child.kill("SIGTERM"), AIDER_TIMEOUT_MS);
    const onData = (d) => { const s = d.toString(); out += s; process.stdout.write(s); fs.appendFileSync(logFile, s); };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", (e) => { clearTimeout(timer); resolve({ code: 127, out: `${out}\n${e.message}` }); });
    child.on("close", (code) => { clearTimeout(timer); resolve({ code: code ?? 1, out }); });
  });
}

function discard(base, branch, patchFile) {
  git("add", "-A");
  const d = git("diff", "--cached", "HEAD");
  if (d.out.trim() && patchFile) fs.writeFileSync(patchFile, d.out);
  git("reset", "--hard", "HEAD");
  git("clean", "-fd");
  // Only delete the scratch branch once we are safely back on the base branch.
  if (git("checkout", base).code === 0 && branch.startsWith("agent/")) git("branch", "-D", branch);
}

async function runDuty(duty) {
  const id = duty.id;
  const ts = stamp();
  const logFile = path.join(LOGS_DIR, `${ts}-${id}.log`);
  const patchFile = path.join(LOGS_DIR, `${ts}-${id}.patch`);
  const promptFile = path.join(LOGS_DIR, `${ts}-${id}.prompt.md`);
  const result = (status, note = "") => {
    const line = JSON.stringify({ ts, duty: id, status, note });
    fs.appendFileSync(path.join(LOGS_DIR, "runs.jsonl"), line + "\n");
    log(`${id}: ${status}${note ? " - " + note : ""}`);
    return status;
  };

  fs.writeFileSync(promptFile, buildPrompt(duty));
  if (args["dry-run"]) {
    log(`DRY RUN for "${id}" (gate: ${duty.gate.join(", ") || "none"}, model: ${MODEL})`);
    console.log("\n" + fs.readFileSync(promptFile, "utf8") + "\n");
    return result("dry-run");
  }

  if (!process.env.GEMINI_API_KEY && MODEL.startsWith("gemini/") && !process.env.AIDER_CMD) {
    return result("error", "GEMINI_API_KEY missing. Put it in .env at the project root (free key: https://aistudio.google.com/apikey).");
  }
  const dirty = git("status", "--porcelain");
  if (dirty.out.trim()) return result("error", "working tree has uncommitted changes. Commit or stash them first; the agent never works on top of unsaved edits.");

  if (duty.runIf === "gate-fails") {
    const pre = gate(duty.gate);
    if (pre.every((g) => g.ok)) return result("skipped", "type-check already passes, nothing to fix");
    fs.appendFileSync(promptFile, "\n\n## Current type-check errors\n" + pre.filter((g) => !g.ok).map((g) => `### ${g.dir}\n${g.out}`).join("\n"));
  }

  const base = git("rev-parse", "--abbrev-ref", "HEAD").out.trim();
  const branch = `agent/${id}-${ts}-${Math.random().toString(36).slice(2, 6)}`;
  const co = git("checkout", "-b", branch);
  if (co.code !== 0) return result("error", `could not create branch ${branch}: ${co.out.slice(-200)}`);
  const verifiedBefore = verifiedCount();

  const res = await runAider(duty, promptFile, logFile);

  if (/\b429\b|RESOURCE_EXHAUSTED|rate.?limit|quota/i.test(res.out) && res.code !== 0) {
    discard(base, branch);
    return result("rate-limited", "Gemini free-tier limit hit; will retry next scheduled run");
  }
  if (res.code === 127) {
    discard(base, branch);
    return result("error", `could not start "${AIDER}". Install it with: pip install aider-chat`);
  }

  const files = changedFiles();
  if (!files.length) {
    discard(base, branch);
    return result("no-changes", "the model made no edits (see log)");
  }

  const bad = files.filter((f) => PROTECTED.some((p) => p.test(f)));
  if (bad.length) {
    discard(base, branch, patchFile);
    return result("rejected", `touched protected paths: ${bad.join(", ")}`);
  }
  if (verifiedCount() > verifiedBefore) {
    discard(base, branch, patchFile);
    return result("rejected", "tried to mark a milestone verified/shipped. Only Justin verifies.");
  }
  const pkgDiff = git("diff", "-U0", "--", "*package.json").out;
  if (BANNED_DEPS.test(pkgDiff)) {
    discard(base, branch, patchFile);
    return result("rejected", "added a banned paid-API dependency (spec.md section 4)");
  }

  const g = gate(duty.gate);
  const failed = g.filter((x) => !x.ok);
  if (failed.length) {
    fs.appendFileSync(logFile, "\n\n=== GATE FAILURE ===\n" + failed.map((f) => `${f.dir}:\n${f.out}`).join("\n"));
    discard(base, branch, patchFile);
    return result("failed-gate", `type-check failed in ${failed.map((f) => f.dir).join(", ")}; diff saved to ${path.relative(ROOT, patchFile)}`);
  }

  git("add", "-A");
  const c = git("commit", "-m", `agent(${id}): ${duty.title}`);
  if (c.code !== 0) {
    discard(base, branch, patchFile);
    return result("error", `git commit failed: ${c.out.slice(-300)}`);
  }
  let note = `branch ${branch}`;
  if (args.push || args.pr) {
    const p = git("push", "-u", "origin", branch);
    note += p.code === 0 ? " (pushed)" : ` (push FAILED: ${p.out.slice(-200)})`;
    if (p.code === 0 && args.pr) {
      const pr = run("gh", ["pr", "create", "--base", base, "--head", branch, "--title", `agent(${id}): ${duty.title}`, "--body", "Automated by the Ten4 Text agent. Passed the type-check gate. Review before merging."]);
      note += pr.code === 0 ? " (PR opened)" : " (PR not opened: gh unavailable or not authenticated)";
    }
  }
  git("checkout", base);
  return result("committed", note);
}

async function main() {
  const duties = listDuties();
  if (args.list) {
    for (const d of duties) console.log(`${d.id.padEnd(22)} ${d.schedule.padEnd(8)} gate:${d.gate.join("+") || "none"}  ${d.title}`);
    return;
  }
  if (args.doctor) {
    const checks = [
      ["git repo", git("rev-parse", "--is-inside-work-tree").code === 0],
      ["node >= 18", Number(process.versions.node.split(".")[0]) >= 18],
      ["aider installed", run(AIDER, ["--version"]).code === 0],
      ["GEMINI_API_KEY set", Boolean(process.env.GEMINI_API_KEY)],
      ["duties found", duties.length > 0],
    ];
    for (const [n, ok] of checks) console.log(`${ok ? "OK  " : "FAIL"}  ${n}`);
    process.exitCode = checks.every((c) => c[1]) ? 0 : 1;
    return;
  }
  let todo = [];
  if (args.schedule) todo = duties.filter((d) => d.schedule === args.schedule);
  else if (args._[0]) {
    const d = duties.find((x) => x.id === args._[0]);
    if (!d) { console.error(`No duty "${args._[0]}". Run: node agent/run.mjs --list`); process.exitCode = 1; return; }
    todo = [d];
  } else {
    console.error("Usage: node agent/run.mjs <duty-id> | --schedule nightly|weekly | --list | --doctor  [--push] [--pr] [--dry-run]");
    process.exitCode = 1;
    return;
  }
  if (!todo.length) log("no duties match.");
  let bad = false;
  for (const d of todo) {
    const s = await runDuty(d);
    if (s === "rate-limited") break; // stop for the day; no point hammering the free tier
    if (s === "error" || s === "failed-gate" || s === "rejected") bad = true;
  }
  if (bad) process.exitCode = 1;
}
main();
