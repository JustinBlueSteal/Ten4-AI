#!/usr/bin/env node
// Teach the agent a rule. It reads agent/knowledge/lessons.md at the start of every run.
//   node agent/teach.mjs "Never rename the Settings tab; testers know it by that name."
//   node agent/teach.mjs --list
import fs from "node:fs";
import { LESSONS } from "./lib.mjs";

const arg = process.argv.slice(2);
if (arg[0] === "--list" || !arg.length) {
  console.log(fs.existsSync(LESSONS) ? fs.readFileSync(LESSONS, "utf8") : "(no lessons yet)");
  if (!arg.length) console.log('\nTeach a rule:  node agent/teach.mjs "your rule in plain English"');
  process.exit(0);
}
const text = arg.join(" ").trim().replace(/\s+/g, " ");
const date = new Date().toISOString().slice(0, 10);
fs.appendFileSync(LESSONS, `\n- [${date}] ${text}`);
console.log(`Taught: ${text}\nThe agent will apply this on every run, starting with the next one.`);
