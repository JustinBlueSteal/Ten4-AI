import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../theme";
import type { Settings } from "../types";
import { checkHealth } from "../api/backend";

export default function SettingsScreen({ settings, onChange }: { settings: Settings; onChange: (s: Settings) => void }) {
  const [report, setReport] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    setRunning(true);
    const lines: string[] = [];
    try {
      const r = await fetch("https://api.openmhz.com/systems", { headers: { Accept: "application/json" } });
      lines.push(`OpenMHz from this device: HTTP ${r.status} ${r.ok ? "(OK, M7 evidence)" : "(blocked)"}`);
    } catch (e) {
      lines.push(`OpenMHz from this device: network error (${e instanceof Error ? e.message : String(e)})`);
    }
    try {
      const h = await checkHealth(settings.backendUrl.replace(/\/$/, ""));
      lines.push(`Backend: reachable. Whisper ${h.whisper ? "up" : "DOWN"}; LLM ${h.llmProvider} ${h.llmConfigured ? "configured" : "NOT configured (set GEMINI_API_KEY)"}`);
    } catch (e) {
      lines.push(`Backend: unreachable at ${settings.backendUrl} (${e instanceof Error ? e.message : String(e)})`);
    }
    setReport(lines);
    setRunning(false);
  };

  return (
    <ScrollView style={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Backend URL</Text>
      <Text style={styles.hint}>Your computer's LAN IP, e.g. http://192.168.1.23:4000 (not localhost)</Text>
      <TextInput style={styles.input} value={settings.backendUrl} onChangeText={(v) => onChange({ ...settings, backendUrl: v.trim() })} autoCapitalize="none" autoCorrect={false} />
      <Text style={styles.label}>Caption language</Text>
      <Text style={styles.hint}>Defaults to your device language. Type any language name.</Text>
      <TextInput style={styles.input} value={settings.language} onChangeText={(v) => onChange({ ...settings, language: v })} autoCorrect={false} />
      <Pressable style={[styles.btn, running && { opacity: 0.5 }]} disabled={running} onPress={runTests}>
        <Text style={styles.btnText}>{running ? "Testing…" : "Run connection tests"}</Text>
      </Pressable>
      <View style={{ marginTop: 12 }}>{report.map((l) => <Text key={l} style={styles.report}>{l}</Text>)}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 16 },
  label: { color: colors.text, fontWeight: "700", marginTop: 8 },
  hint: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  input: { backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1, borderRadius: 10, color: colors.text, padding: 12, marginBottom: 8 },
  btn: { backgroundColor: colors.accent, borderRadius: 10, padding: 12, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700" },
  report: { color: colors.text, marginBottom: 6 },
});
