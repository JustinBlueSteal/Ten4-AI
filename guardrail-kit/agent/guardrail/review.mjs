// Guardrail reviewer for Ten4 Text pull requests.
// 1) Deterministic rules (cannot be talked around), 2) an independent LLM review.
// Zero dependencies. Needs Node 20+ (global fetch). Runs in GitHub Actions.
//
// Local dry run (no network, no comment posted):
//   DRY_RUN=1 BASE_SHA=<sha> HEAD_SHA=<sha> PR_BODY="Milestone: M9" node agent/guardrail/review.mjs

import { execSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const env = process.env;
const BASE = env.BASE_SHA;
const HEAD = env.HEAD_SHA || "HEAD";
const MODEL = env.GUARDRAIL_MODEL || "gemini-3.1-flash-lite";
const DRY = env.DRY_RUN === "1";
const MARKER = "<!-- ten4-guardrail -->";

// ---------------- Editable policy ----------------
const PROTECTED = [
  /^spec\.md$/i,
  /^MILESTONES\.md$/i,
  /(^|\/)\.env(\.(?!example$)[^/]+)?$/, // .env, .env.local ... but not .env.example
  /^\.github\//,
  /^agent\/guardrail\//,
];
const MAX_FILES = 40;
const MAX_ADDED_LINES = 1500;
const MAX_DIFF_CHARS = 60000;
const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z_-]{30,}/,
  /\bAQ\.[A-Za-z0-9_-]{30,}/,
  /(GEMINI|GOOGLE|OPENAI|ANTHROPIC)_API_KEY\s*=\s*["']?[A-Za-z0-9_.-]{16,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];
const MOCK_PATTERN = /\b(mock|dummy|fake|lorem ipsum|placeholder data|sample data|hardcoded caption)/i;
const TEST_PATH = /(^|\/)(__tests__|tests?|e2e)\/|\.(test|spec)\.[jt]sx?$/;
const CODE_PATH = /\.(ts|tsx|js|jsx|mjs|json)$/;
// -------------------------------------------------

if (!BASE) {
  console.error("BASE_SHA is required");
  process.exit(2);
}

const sh = (c) => execSync(c, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const showBase = (path) => {
  try { return sh(`git show ${BASE}:${path}`); } catch { return ""; }
};

const range = `${BASE}...${HEAD}`;
const changed = sh(`git diff --name-only ${range}`).split("\n").filter(Boolean);
const diff = sh(`git diff --unified=2 ${range}`);

function addedByFile(d) {
  const out = {};
  let file = null;
  for (const line of d.split("\n")) {
    if (line.startsWith("+++ b/")) { file = line.slice(6); out[file] ||= []; }
    else if (line.startsWith("+++ ")) { file = null; }
    else if (file && line.startsWith("+")) out[file].push(line.slice(1));
  }
  return out;
}
const added = addedByFile(diff);
const addedCount = Object.values(added).reduce((n, a) => n + a.length, 0);

function parseMilestones(md) {
  const map = {};
  let cur = null;
  for (const line of md.split("\n")) {
    const h = line.match(/^###\s+(M\d+[A-Z]?)\b\s*[—–-]?\s*(.*)$/);
    if (h) {
      cur = h[1].toUpperCase();
      map[cur] = { title: h[2].trim(), status: "unknown", text: line + "\n" };
      continue;
    }
    if (/^(##\s|---\s*$)/.test(line)) { cur = null; continue; }
    if (cur) {
      map[cur].text += line + "\n";
      const s = line.match(/\*\*Status:\*\*\s*([a-z-]+)/i);
      if (s) map[cur].status = s[1].toLowerCase();
    }
  }
  return map;
}

// Judge against the BASE versions so a PR cannot rewrite the rules it is judged by.
const spec = showBase("spec.md");
const milestonesMd = showBase("MILESTONES.md");
const milestones = parseMilestones(milestonesMd);

const title = env.PR_TITLE || "";
const body = env.PR_BODY || "";
const declared = (`${title}\n${body}`.match(/Milestone:\s*(M\d+[A-Za-z]?)/i) || [])[1]?.toUpperCase() || null;

const findings = []; // { level: "FAIL" | "WARN", rule, detail }
const fail = (rule, detail) => findings.push({ level: "FAIL", rule, detail });
const warn = (rule, detail) => findings.push({ level: "WARN", rule, detail });

// 1. Protected files
for (const f of changed) {
  if (PROTECTED.some((re) => re.test(f))) {
    fail("protected-file", `\`${f}\` is protected. Agents may not edit it; describe the needed change in the PR text instead.`);
  }
}

// 2. Secrets (never echo the value)
let secretHit = false;
for (const [f, lines] of Object.entries(added)) {
  for (const l of lines) {
    if (SECRET_PATTERNS.some((re) => re.test(l))) {
      secretHit = true;
      fail("secret", `Possible API key or secret added in \`${f}\`. Remove it and rotate the key.`);
      break;
    }
  }
}

// 3. OpenMHz must never be called from the backend
for (const [f, lines] of Object.entries(added)) {
  if (f.startsWith("backend/") && !TEST_PATH.test(f) && lines.some((l) => /openmhz\.com/i.test(l))) {
    fail("openmhz-backend", `\`${f}\` references openmhz.com. OpenMHz may only be called from mobile/ (server requests get HTTP 403).`);
  }
}

// 4. Mock / demo data (WARN here, the LLM review rules on it)
for (const [f, lines] of Object.entries(added)) {
  if (TEST_PATH.test(f) || !CODE_PATH.test(f)) continue;
  const hit = lines.find((l) => MOCK_PATTERN.test(l));
  if (hit) warn("mock-data", `\`${f}\` adds a line that looks like mock/demo data. The project rule is real data paths only.`);
}

// 5. Size
if (changed.length > MAX_FILES || addedCount > MAX_ADDED_LINES) {
  warn("too-big", `${changed.length} files / ${addedCount} added lines. Too large to review well. Ask the agent for smaller PRs.`);
}

// 6. Milestone declaration
if (!declared) {
  fail("milestone-missing", "Add a line `Milestone: M<id>` to the PR description so the work can be checked against the plan.");
} else if (!milestones[declared]) {
  fail("milestone-unknown", `\`${declared}\` is not in MILESTONES.md.`);
} else if (["verified", "shipped"].includes(milestones[declared].status)) {
  warn("milestone-closed", `${declared} is already \`${milestones[declared].status}\`. Confirm this PR is a bug fix, not new scope.`);
}

// 7. New dependencies
const pkgFiles = changed.filter((f) => /(^|\/)package\.json$/.test(f));
for (const f of pkgFiles) {
  const deps = (added[f] || [])
    .map((l) => l.match(/^\s*"([@\w./-]+)":\s*"([~^]?\d[^"]*)"/))
    .filter((m) => m && m[1] !== "version")
    .map((m) => `${m[1]}@${m[2]}`);
  if (deps.length) warn("new-dependency", `\`${f}\` adds or changes: ${deps.join(", ")}. Confirm each is free and Expo-compatible.`);
}

// 8. Typecheck results from the workflow
for (const [name, val] of [["mobile", env.TSC_MOBILE], ["backend", env.TSC_BACKEND]]) {
  if (val === "failure") fail("typecheck", `\`tsc --noEmit\` failed in ${name}/.`);
}

// ---------------- LLM review ----------------
async function llmReview() {
  if (secretHit) return { verdict: "skipped", note: "Skipped: the diff contains a possible secret, so it was not sent to any model." };
  if (!env.GEMINI_API_KEY) return { verdict: "skipped", note: "Skipped: GEMINI_API_KEY is not set (add it as a repo secret)." };

  const section = declared && milestones[declared] ? milestones[declared].text : "(none declared)";
  const trimmedDiff = diff.length > MAX_DIFF_CHARS ? diff.slice(0, MAX_DIFF_CHARS) + "\n...[diff truncated]" : diff;
  const prompt = `You are the independent reviewer for the Ten4 Text app project. A coding agent opened a pull request. Judge it ONLY against the project's own documents below. Be skeptical: assume the author is overconfident. Do not praise.

Check:
1. Scope: does the diff implement the declared milestone and its acceptance criteria, and nothing that is not traceable to spec.md?
2. Real vs fake: any mock/demo/dummy data, hard-coded captions, stubbed pipelines, or TODO placeholders presented as working?
3. Captions: any caption path that drops the spoken 10-code and shows only a paraphrase?
4. Architecture: OpenMHz only from mobile/; Gemini for translation; Whisper via the backend; no paid services.
5. Honesty: does the PR text claim anything the diff does not support, or claim verification that only a real device can give?
6. Obvious bugs, unhandled errors on the main path, secrets in logs.

Return JSON only, no prose:
{"verdict":"pass|concerns|fail","in_scope":true,"milestone_progress":"one sentence","issues":[{"severity":"high|medium|low","file":"path or null","detail":"..."}],"needs_human_verification":["..."]}
Use "fail" only for a clear violation. Use "concerns" for anything a human should look at before merging.

=== spec.md ===
${spec.slice(0, 14000)}

=== Declared milestone section from MILESTONES.md (${declared || "none"}) ===
${section}

=== PR title and description ===
${title}
${body}

=== Deterministic findings so far ===
${JSON.stringify(findings)}

=== Diff ===
${trimmedDiff}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const req = {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
    }),
  };

  let res;
  for (let attempt = 0; attempt < 2; attempt++) {
    res = await fetch(url, req).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }));
    if (res.ok || ![0, 429, 500, 503].includes(res.status)) break;
    await new Promise((r) => setTimeout(r, 20000));
  }
  if (!res.ok) {
    return { verdict: "unavailable", note: `Model call failed (HTTP ${res.status}). A human must read the diff.` };
  }
  try {
    const data = await res.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  } catch {
    return { verdict: "unavailable", note: "Model reply could not be parsed. A human must read the diff." };
  }
}

const llm = await llmReview();

// ---------------- Verdict + comment ----------------
const hasFail = findings.some((f) => f.level === "FAIL") || llm.verdict === "fail";
const hasWarn = findings.some((f) => f.level === "WARN") || ["concerns", "skipped", "unavailable"].includes(llm.verdict);
const status = hasFail ? "FAIL" : hasWarn ? "CONCERNS" : "PASS";

const lines = [];
lines.push(MARKER);
lines.push(`## Guardrail: ${status}`);
lines.push(`Milestone declared: **${declared || "none"}**${declared && milestones[declared] ? ` (${milestones[declared].title}, status: ${milestones[declared].status})` : ""}`);
lines.push(`Changed: ${changed.length} files, +${addedCount} lines`);
lines.push("");
lines.push("### Rule checks");
if (!findings.length) lines.push("No rule violations found.");
for (const f of findings) lines.push(`- **${f.level}** \`${f.rule}\`: ${f.detail}`);
lines.push("");
lines.push("### Independent model review");
if (llm.note) lines.push(llm.note);
if (llm.verdict && !llm.note) {
  lines.push(`Verdict: **${llm.verdict}**. In scope: **${llm.in_scope}**.`);
  if (llm.milestone_progress) lines.push(llm.milestone_progress);
  for (const i of llm.issues || []) lines.push(`- **${i.severity}**${i.file ? ` \`${i.file}\`` : ""}: ${i.detail}`);
  if ((llm.needs_human_verification || []).length) {
    lines.push("");
    lines.push("**Needs your verification on a real device:**");
    for (const v of llm.needs_human_verification) lines.push(`- ${v}`);
  }
}
lines.push("");
lines.push("_This check cannot mark a milestone verified or merge anything. The model reviewer is a second pair of eyes, not a guarantee. Read the diff before you merge._");
const comment = lines.join("\n");

if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, comment + "\n");

if (DRY) {
  console.log(comment);
} else if (env.GITHUB_TOKEN && env.PR_NUMBER && env.GITHUB_REPOSITORY) {
  const api = `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/issues/${env.PR_NUMBER}/comments`;
  const headers = {
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "content-type": "application/json",
  };
  try {
    const existing = await (await fetch(`${api}?per_page=100`, { headers })).json();
    const mine = Array.isArray(existing) ? existing.find((c) => c.body?.includes(MARKER)) : null;
    if (mine) {
      await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/issues/comments/${mine.id}`, { method: "PATCH", headers, body: JSON.stringify({ body: comment }) });
    } else {
      await fetch(api, { method: "POST", headers, body: JSON.stringify({ body: comment }) });
    }
  } catch (e) {
    console.error("Could not post PR comment:", String(e));
  }
}

console.log(`Guardrail status: ${status}`);
process.exit(hasFail ? 1 : 0);
