#!/usr/bin/env node
// Assign the agent a new duty (a recurring or one-off job) in plain English.
//   node agent/assign.mjs --id add-urdu-test --schedule weekly "Check that captions render right-to-left ..."
// Options: --id <slug> --title <text> --schedule manual|nightly|weekly --gate backend,mobile|none --files a,b --force
import fs from "node:fs";
import path from "node:path";
import { DUTIES_DIR, parseArgs, slug } from "./lib.mjs";

const a = parseArgs(process.argv.slice(2), ["id", "title", "schedule", "gate", "files"]);
const body = a._.join(" ").trim();
if (!body) {
  console.log('Usage: node agent/assign.mjs [--id slug] [--title "Short title"] [--schedule manual|nightly|weekly] [--gate backend,mobile|none] [--files path1,path2] "plain-English instructions"');
  process.exit(1);
}
function shortTitle(text) {
  const first = text.split(/(?<=[.!?])\s/)[0];
  if (first.length <= 60) return first.replace(/[.!?]$/, "");
  return first.slice(0, 60).replace(/\s+\S*$/, "") + "…";
}
const schedule = a.schedule || "manual";
if (!["manual", "nightly", "weekly"].includes(schedule)) {
  console.error("--schedule must be manual, nightly or weekly");
  process.exit(1);
}
const id = slug(a.id || body.split(/\s+/).slice(0, 5).join(" "));
const file = path.join(DUTIES_DIR, `${id}.md`);
if (fs.existsSync(file) && !a.force) {
  console.error(`Duty "${id}" already exists. Pick another --id or pass --force to overwrite.`);
  process.exit(1);
}
const header = [
  "---",
  `id: ${id}`,
  `title: ${a.title || shortTitle(body)}`,
  `schedule: ${schedule}`,
  `gate: ${a.gate || "backend,mobile"}`,
  ...(a.files ? [`files: ${a.files}`] : []),
  "---",
].join("\n");
fs.mkdirSync(DUTIES_DIR, { recursive: true });
fs.writeFileSync(file, `${header}\n${body}\n`);
console.log(`Created agent/duties/${id}.md  (schedule: ${schedule})`);
console.log(`Try it:   node agent/run.mjs ${id} --dry-run`);
console.log(`Run it:   node agent/run.mjs ${id}`);
