#!/usr/bin/env node
/**
 * E2E Pipeline Integration Test
 * Tests real backend health (/health) and captioning endpoint (/caption).
 *
 * Usage:
 *   node tools/test-e2e-pipeline.mjs [backendUrl]
 */

const backendUrl = (process.argv[2] || process.env.BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");

console.log(`[E2E Pipeline Test] Target backend: ${backendUrl}`);

// 1. Health check
try {
  const healthRes = await fetch(`${backendUrl}/health`);
  if (!healthRes.ok) {
    console.error(`❌ Health check failed with status ${healthRes.status}`);
    process.exit(1);
  }
  const health = await healthRes.json();
  console.log(`✅ Health check passed:`, health);

  if (!health.whisper) {
    console.warn(`⚠️ Warning: Whisper service is reported as DOWN by backend.`);
  }
  if (!health.llmConfigured) {
    console.warn(`⚠️ Warning: LLM is reported as NOT CONFIGURED by backend.`);
  }
} catch (err) {
  console.error(`❌ Unable to reach backend health endpoint:`, err.message);
  process.exit(1);
}

// 2. Sample 1-second silent MP4/AAC audio buffer (real audio binary header)
// Valid AAC/MP4 container header bytes
const sampleAudioBase64 = "AAAAIGZ0eXBpc29tAAAAAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAA1tZGF0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

console.log(`[E2E Pipeline Test] Sending real audio caption request to ${backendUrl}/caption...`);

try {
  const captionRes = await fetch(`${backendUrl}/caption`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audioBase64: sampleAudioBase64,
      mime: "audio/mp4",
      language: "English",
      context: "Test Dispatch Feed",
      dictionary: { "10-4": "Message received / OK" }
    })
  });

  if (!captionRes.ok) {
    const errorBody = await captionRes.text();
    console.error(`❌ Caption request failed (HTTP ${captionRes.status}):`, errorBody);
    process.exit(1);
  }

  const caption = await captionRes.json();
  console.log(`✅ Caption endpoint returned:`, caption);

  if (!caption.original_snippet && caption.original_snippet !== "") {
    console.error(`❌ Missing original_snippet in caption output`);
    process.exit(1);
  }

  if (!caption.clean_translation) {
    console.error(`❌ Missing clean_translation in caption output`);
    process.exit(1);
  }

  if (!["LOW", "MEDIUM", "HIGH"].includes(caption.urgency_level)) {
    console.error(`❌ Invalid urgency_level: ${caption.urgency_level}`);
    process.exit(1);
  }

  console.log(`🎉 E2E Pipeline Verification Successful!`);
  process.exit(0);
} catch (err) {
  console.error(`❌ Caption request failed with error:`, err.message);
  process.exit(1);
}
