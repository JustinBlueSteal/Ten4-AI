import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors } from "./src/theme";
import { KEYS, loadJson, saveJson } from "./src/lib/storage";
import { STARTER_DICTIONARY, type Dictionary } from "./src/lib/dictionary";
import type { OmhzSystem, Settings } from "./src/types";
import FeedsScreen from "./src/screens/FeedsScreen";
import ListenScreen from "./src/screens/ListenScreen";
import DictionaryScreen from "./src/screens/DictionaryScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import AdminDashboardScreen from "./src/screens/AdminDashboardScreen";

type Tab = "feeds" | "listen" | "dictionary" | "settings" | "admin";
const TABS: { id: Tab; label: string }[] = [
  { id: "feeds", label: "Feeds" },
  { id: "listen", label: "Listen" },
  { id: "dictionary", label: "Codes" },
  { id: "settings", label: "Settings" },
  { id: "admin", label: "Admin" },
];

function deviceLanguage(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
    const code = locale.split("-")[0];
    const name = new Intl.DisplayNames(["en"], { type: "language" }).of(code);
    return name && name !== code ? name : "English";
  } catch {
    return "English";
  }
}

const DEFAULT_SETTINGS: Settings = {
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:4000",
  language: deviceLanguage(),
};

export default function App() {
  const [tab, setTab] = useState<Tab>("feeds");
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [dictionary, setDictionary] = useState<Dictionary>(STARTER_DICTIONARY);
  const [system, setSystem] = useState<OmhzSystem | null>(null);

  useEffect(() => {
    (async () => {
      setSettings(await loadJson(KEYS.settings, DEFAULT_SETTINGS));
      setDictionary(await loadJson(KEYS.dictionary, STARTER_DICTIONARY));
      setSystem(await loadJson<OmhzSystem | null>(KEYS.system, null));
      setReady(true);
    })();
  }, []);

  const updateSettings = (s: Settings) => { setSettings(s); void saveJson(KEYS.settings, s); };
  const updateDictionary = (d: Dictionary) => { setDictionary(d); void saveJson(KEYS.dictionary, d); };
  const pickSystem = (s: OmhzSystem) => { setSystem(s); void saveJson(KEYS.system, s); setTab("listen"); };

  if (!ready) return <View style={styles.root} />;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>TEN4 TEXT</Text>
        <Text style={styles.subtitle}>Emergency radio, in plain language</Text>
      </View>
      <View style={styles.body}>
        {tab === "feeds" && <FeedsScreen onPick={pickSystem} />}
        {tab === "listen" && <ListenScreen system={system} settings={settings} dictionary={dictionary} onChooseFeed={() => setTab("feeds")} />}
        {tab === "dictionary" && <DictionaryScreen dictionary={dictionary} onChange={updateDictionary} />}
        {tab === "settings" && <SettingsScreen settings={settings} onChange={updateSettings} />}
        {tab === "admin" && <AdminDashboardScreen />}
      </View>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t.id} style={styles.tab} onPress={() => setTab(t.id)}>
            <Text style={[styles.tabText, tab === t.id && styles.tabActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 36, paddingBottom: 10 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: 2 },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  body: { flex: 1 },
  tabs: { flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.panel },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabText: { color: colors.muted, fontWeight: "600" },
  tabActive: { color: colors.accent },
});
