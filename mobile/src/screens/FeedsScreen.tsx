import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../theme";
import { listSystems, OpenMhzError, type OmhzSystem } from "../api/openmhz";
import { getMyPlace, systemsNear } from "../lib/location";

export default function FeedsScreen({ onPick }: { onPick: (s: OmhzSystem) => void }) {
  const [systems, setSystems] = useState<OmhzSystem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [nearLabel, setNearLabel] = useState<string | null>(null);
  const [near, setNear] = useState<OmhzSystem[] | null>(null);
  const [locating, setLocating] = useState(false);

  const load = () => {
    setError(null);
    setSystems(null);
    listSystems()
      .then(setSystems)
      .catch((e) =>
        setError(
          e instanceof OpenMhzError && e.status === 403
            ? "OpenMHz blocked this request (HTTP 403). That is the M7 blocker. Open Settings > Run connection tests and note the result."
            : `Couldn't load feeds: ${e instanceof Error ? e.message : String(e)}`
        )
      );
  };
  useEffect(load, []);

  const useMyLocation = async () => {
    if (!systems) return;
    setLocating(true);
    try {
      const place = await getMyPlace();
      const matches = systemsNear(systems, place);
      setNear(matches);
      setNearLabel([place.city, place.county, place.stateAbbr].filter(Boolean).join(", "));
      if (!matches.length) setError("No feeds matched your location. Try the search box.");
      else setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLocating(false);
    }
  };

  const shown = useMemo(() => {
    if (!systems) return [];
    const q = query.trim().toLowerCase();
    if (q) {
      return systems
        .filter((s) => `${s.name} ${s.city ?? ""} ${s.county ?? ""} ${s.state ?? ""}`.toLowerCase().includes(q))
        .slice(0, 100);
    }
    return (near ?? systems).slice(0, 100);
  }, [systems, near, query]);

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        placeholder="Search city, county, state or agency"
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />
      <Pressable style={[styles.btn, (!systems || locating) && { opacity: 0.5 }]} disabled={!systems || locating} onPress={useMyLocation}>
        <Text style={styles.btnText}>{locating ? "Locating…" : "Use my location"}</Text>
      </Pressable>
      {nearLabel && !query ? <Text style={styles.note}>Feeds near {nearLabel}</Text> : null}
      {error ? (
        <View style={styles.errBox}>
          <Text style={styles.errText}>{error}</Text>
          <Pressable onPress={load}><Text style={styles.retry}>Retry</Text></Pressable>
        </View>
      ) : null}
      {!systems && !error ? <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} /> : null}
      <FlatList
        data={shown}
        keyExtractor={(s) => s.shortName}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => onPick(item)}>
            <Text style={styles.rowTitle}>{item.name}</Text>
            <Text style={styles.rowSub}>{[item.city, item.county, item.state].filter(Boolean).join(" · ") || item.shortName}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 16 },
  input: { backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1, borderRadius: 10, color: colors.text, padding: 12, marginBottom: 8 },
  btn: { backgroundColor: colors.accent, borderRadius: 10, padding: 12, alignItems: "center", marginBottom: 8 },
  btnText: { color: "#fff", fontWeight: "700" },
  note: { color: colors.muted, marginBottom: 6 },
  row: { backgroundColor: colors.panel, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  rowTitle: { color: colors.text, fontWeight: "700" },
  rowSub: { color: colors.muted, marginTop: 2, fontSize: 12 },
  errBox: { backgroundColor: "#3A1620", borderRadius: 10, padding: 12, marginBottom: 8 },
  errText: { color: "#FFB4B8" },
  retry: { color: colors.accent, marginTop: 6, fontWeight: "700" },
});
