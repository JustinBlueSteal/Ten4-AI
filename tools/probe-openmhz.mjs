#!/usr/bin/env node
// Quick check of OpenMHz from THIS computer. Expect HTTP 403 here (that's why polling lives in the phone app).
// The real M7 test is the "Run connection tests" button in the app's Settings tab, on your phone.
const BASE = "https://api.openmhz.com";
for (const p of ["/systems"]) {
  try {
    const r = await fetch(BASE + p, { headers: { Accept: "application/json" } });
    console.log(`${p}: HTTP ${r.status}`);
    if (r.ok) {
      const d = await r.json();
      const arr = Array.isArray(d) ? d : d.systems ?? [];
      console.log(`  ${arr.length} systems. First entry keys: ${Object.keys(arr[0] ?? {}).join(", ")}`);
    }
  } catch (e) {
    console.log(`${p}: ${e.message}`);
  }
}
