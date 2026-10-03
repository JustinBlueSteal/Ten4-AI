import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../theme";
import { STARTER_DICTIONARY, type Dictionary } from "../lib/dictionary";

export default function DictionaryScreen({ dictionary, onChange }: { dictionary: Dictionary; onChange: (d: Dictionary) => void }) {
  const [code, setCode] = useState("");
  const [meaning, setMeaning] = useState("");
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return Object.entries(dictionary)
      .filter(([k, v]) => !f || k.toLowerCase().includes(f) || v.toLowerCase().includes(f))
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  }, [dictionary, filter]);

  const save = () => {
    const k = code.trim();
    const v = meaning.trim();
    if (!k || !v) return;
    onChange({ ...dictionary, [k]: v });
    setCode("");
    setMeaning("");
  };
  const remove = (k: string) => {
    const { [k]: _gone, ...rest } = dictionary;
    onChange(rest);
  };
  const reset = () =>
    Alert.alert("Reset dictionary?", "This replaces all your edits with the starter list.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => onChange(STARTER_DICTIONARY) },
    ]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.note}>Codes differ between agencies. Edit these to match yours; changes are used for every new caption.</Text>
      <View style={styles.addRow}>
        <TextInput style={[styles.input, { width: 90 }]} placeholder="10-50" placeholderTextColor={colors.muted} value={code} onChangeText={setCode} autoCapitalize="none" />
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Plain-language meaning" placeholderTextColor={colors.muted} value={meaning} onChangeText={setMeaning} />
        <Pressable style={styles.add} onPress={save}><Text style={styles.addText}>Save</Text></Pressable>
      </View>
      <TextInput style={styles.input} placeholder="Filter" placeholderTextColor={colors.muted} value={filter} onChangeText={setFilter} autoCapitalize="none" />
      <FlatList
        data={rows}
        keyExtractor={([k]) => k}
        renderItem={({ item: [k, v] }) => (
          <Pressable style={styles.row} onPress={() => { setCode(k); setMeaning(v); }}>
            <Text style={styles.code}>{k}</Text>
            <Text style={styles.meaning}>{v}</Text>
            <Pressable onPress={() => remove(k)} hitSlop={10}><Text style={styles.del}>✕</Text></Pressable>
          </Pressable>
        )}
        ListFooterComponent={<Pressable onPress={reset}><Text style={styles.reset}>Reset to starter list</Text></Pressable>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 16 },
  note: { color: colors.muted, fontSize: 12, marginBottom: 8 },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  input: { backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1, borderRadius: 10, color: colors.text, padding: 10, marginBottom: 8 },
  add: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 14, justifyContent: "center", marginBottom: 8 },
  addText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.panel, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
  code: { color: colors.accent, fontWeight: "800", width: 62 },
  meaning: { color: colors.text, flex: 1 },
  del: { color: colors.muted, fontSize: 16 },
  reset: { color: colors.muted, textAlign: "center", padding: 16 },
});
